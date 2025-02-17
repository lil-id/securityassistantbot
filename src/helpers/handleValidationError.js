function handleValidationErrors(error) {
    if (error) {
        const errorDetails = error.details.map((detail) => detail.message);

        return {
            status: false,
            message: "failed",
            code: 422,
            error: errorDetails.join(", "),
        };
    }
}

module.exports = handleValidationErrors;
