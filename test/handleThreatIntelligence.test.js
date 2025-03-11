const { fetchLatestThreats, lookupThreat } = require("../src/controllers/handleThreatIntelligence");
const axios = require("axios");
const logger = require("../src/helpers/logger");

jest.mock("axios");
jest.mock("../src/helpers/logger");

describe("handleThreatIntelligence", () => {
    let client, message;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };
        message = {
            from: "testUser",
            reply: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("fetchLatestThreats", () => {
        it("should fetch and reply with latest threats", async () => {
            axios.post.mockResolvedValue({
                data: {
                    query_status: "ok",
                    data: [
                        {
                            reporter: "reporter1",
                            confidence_level: 90,
                            malware_printable: "malware1",
                            tags: ["tag1", "tag2"],
                            ioc: "ioc1",
                            ioc_type: "type1",
                            ioc_type_desc: "desc1",
                            threat_type: "threat1",
                            threat_type_desc: "desc2",
                            first_seen: "2023-01-01",
                            malware_malpedia: "details1",
                        },
                    ],
                },
            });

            await fetchLatestThreats(client, message, []);

            expect(client.getChatById).toHaveBeenCalledWith(message.from);
            expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("Latest ThreatFox data:"));
        });

        it("should reply with specific threat information if commandOption is provided", async () => {
            const threat = {
                reporter: "reporter1",
                confidence_level: 90,
                malware_printable: "malware1",
                tags: ["tag1", "tag2"],
                ioc: "ioc1",
                ioc_type: "type1",
                ioc_type_desc: "desc1",
                threat_type: "threat1",
                threat_type_desc: "desc2",
                first_seen: "2023-01-01",
                malware_malpedia: "details1",
            };

            await fetchLatestThreats(client, message, ["ioc1"]);

            expect(message.reply).toHaveBeenCalledWith(expect.stringContaining("reporter1"));
        });

        it("should reply with error message if fetching threats fails", async () => {
            axios.post.mockRejectedValue(new Error("Network Error"));

            await fetchLatestThreats(client, message, []);

            expect(message.reply).toHaveBeenCalledWith("Error fetching ThreatFox data. Please try again later.");
        });
    });

    describe("lookupThreat", () => {
        it("should return threat data if found", async () => {
            const threat = {
                reporter: "reporter1",
                confidence_level: 90,
                malware_printable: "malware1",
                tags: ["tag1", "tag2"],
                ioc: "ioc1",
                ioc_type: "type1",
                ioc_type_desc: "desc1",
                threat_type: "threat1",
                threat_type_desc: "desc2",
                first_seen: "2023-01-01",
                malware_malpedia: "details1",
            };

            axios.post.mockResolvedValue({
                data: {
                    query_status: "ok",
                    data: [threat],
                },
            });

            const result = await lookupThreat("ioc1");

            expect(result).toEqual(threat);
        });

        it("should return null if no threat data found", async () => {
            axios.post.mockResolvedValue({
                data: {
                    query_status: "ok",
                    data: [],
                },
            });

            const result = await lookupThreat("ioc1");

            expect(result).toBeNull();
        });

        it("should return null if lookup fails", async () => {
            axios.post.mockRejectedValue(new Error("Network Error"));

            const result = await lookupThreat("ioc1");

            expect(result).toBeNull();
        });
    });
});