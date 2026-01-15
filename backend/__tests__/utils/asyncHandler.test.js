const asyncHandler = require('../../utils/asyncHandler');

describe('AsyncHandler', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('debe ejecutar función async exitosamente', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = asyncHandler(mockFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('debe capturar errores y pasarlos a next', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(mockFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('debe ejecutar la función sin errores', async () => {
    const mockResult = { data: 'test' };
    const mockFn = jest.fn().mockResolvedValue(mockResult);
    const wrappedFn = asyncHandler(mockFn);

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
