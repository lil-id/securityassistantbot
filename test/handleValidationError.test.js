const handleValidationErrors = require('../src/helpers/handleValidationError');

describe('handleValidationErrors', () => {
    test('should return formatted error object when error is provided', () => {
        const error = {
            details: [
                { message: 'Error 1' },
                { message: 'Error 2' },
            ],
        };

        const result = handleValidationErrors(error);

        expect(result).toEqual({
            status: false,
            message: 'failed',
            code: 422,
            error: 'Error 1, Error 2',
        });
    });

    test('should return undefined when no error is provided', () => {
        const result = handleValidationErrors(null);

        expect(result).toBeUndefined();
    });
});