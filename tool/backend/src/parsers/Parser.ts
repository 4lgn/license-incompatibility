export interface Project {
  name: string
  license: string
  version: string
  platform: string
  dependencies: { [depName: string]: string }
}

abstract class Parser {
  constructor() {}

  abstract parse(buffer: Buffer): Project
}

export default Parser
