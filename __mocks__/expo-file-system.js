class File {
  constructor(uri) {
    this.uri = uri;
  }
  async text() {
    return '';
  }
}

module.exports = {
  File,
  documentDirectory: '/test/documents/',
  cacheDirectory: '/test/cache/',
  readAsStringAsync: jest.fn(async () => ''),
  writeAsStringAsync: jest.fn(async () => undefined),
  copyAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  EncodingType: { UTF8: 'utf8' },
};
