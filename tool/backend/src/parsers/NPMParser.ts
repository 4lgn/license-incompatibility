import Parser, { Project } from './Parser'

interface PackageJson {
  name?: string
  version?: string
  license?: string
  dependencies?: {
    [depName: string]: string
  }
}

class NPMParser extends Parser {
  parse(buffer: Buffer): Project {
    // const file = JSON.parse(fs.readFileSync(filename, { encoding: 'utf8' }))
    // console.log(file)
    try {
      const p: PackageJson = JSON.parse(buffer.toString())
      // TODO: Revisit this error handling flow
      // temp... lol
      if (!p.license) p.license = 'MIT'
      if (!p.name || !p.version || !p.license || !p.dependencies)
        throw new Error('One or more required fields of the project was empty')

      return {
        license: p.license,
        name: p.name,
        version: p.version,
        platform: 'NPM',
        dependencies: p.dependencies,
      }
    } catch (e) {
      throw new Error('Could not parse project')
    }
  }
}

export default NPMParser
