const { apiKeyMiddleware } = require("../src/middleware/wazuhMiddleware");
const httpMocks = require("node-mocks-http");

describe("apiKeyMiddleware", () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest({
            method: "GET",
            url: "/some-endpoint",
            headers: {
                "x-api-key": process.env.WAZUH_API_KEY, // ✅ Load API key from .env
            },
        });

        res = httpMocks.createResponse();
        next = jest.fn();
    });

    it("should call next if API key is valid", () => {
        apiKeyMiddleware(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("should return 401 if API key is missing", () => {
        req.headers["x-api-key"] = undefined;
        apiKeyMiddleware(req, res, next);
        expect(res._getStatusCode()).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 if API key is invalid", () => {
        req.headers["x-api-key"] = "wrong-key";
        apiKeyMiddleware(req, res, next);
        expect(res._getStatusCode()).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });
});
