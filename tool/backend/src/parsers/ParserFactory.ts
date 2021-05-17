import NPMParser from './NPMParser'
import Parser from './Parser'

class ParserFactory {
  constructor() {}

  createParser(filename: string): Parser {
    switch (filename) {
      case 'package.json':
        // ...
        return new NPMParser()
      // TODO: Handle more package managers...
      default:
        throw new Error('Unsupported package manager filename')
    }
  }
}

export default ParserFactory
