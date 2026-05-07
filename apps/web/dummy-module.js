class MockRpcException extends Error {
  constructor(error) {
    super(typeof error === 'string' ? error : JSON.stringify(error));
    this.error = error;
  }
  getError() {
    return this.error;
  }
}

module.exports = {
  // nestjs-zod
  createZodDto: () => class {},

  // @nestjs/microservices
  RpcException: MockRpcException,

  // @nestjs/common / @nestjs/swagger decorators
  ApiProperty: () => () => {},
  ApiOperation: () => () => {},
  ApiResponse: () => () => {},
  ApiTags: () => () => {},
  ApiBody: () => () => {},
  ApiQuery: () => () => {},
  ApiParam: () => () => {},
  ApiHeader: () => () => {},
  ApiBearerAuth: () => () => {},

  // Other potential shared decorators
  Injectable: () => () => {},
  Optional: () => () => {},
  Inject: () => () => {},
};
