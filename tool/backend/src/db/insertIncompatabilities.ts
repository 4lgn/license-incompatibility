import Transaction from 'neo4j-driver/types/transaction'
import Driver from 'neo4j-driver/types/driver'

export interface licenseIncompatability {
  id: number
  license1: string
  license2: string
  incompatible: boolean
}

export const insertIncompatabilities = async (
  tx: Transaction,
  licenseIncompatabilities: {
    [incompatabilityId: number]: licenseIncompatability
  }
) => {
  const createLicenses = `
    MERGE (l1: License { name: $l1Name })
    MERGE (l2: License { name: $l2Name })
  `

  const createIncompatabilities = `
    MATCH (l1: License { name: $l1Name })
    MATCH (l2: License { name: $l2Name })
    MERGE (l1)-[:IS_INCOMPATIBLE_WITH]->(l2)
  `

  const deleteIncompatabilities = `
    MATCH (l1: License { name: $l1Name })
    MATCH (l2: License { name: $l2Name })
    MATCH (l1)-[d:IS_INCOMPATIBLE_WITH]->(l2)
    DELETE d
  `

  const inserts = Object.entries(licenseIncompatabilities).map(
    ([key, value]) => {
      const insert = async () => {
        await tx.run(createLicenses, {
          l1Name: value.license1,
          l2Name: value.license2,
        })
        if (value.incompatible) {
          await tx.run(createIncompatabilities, {
            l1Name: value.license1,
            l2Name: value.license2,
          })
        } else {
          await tx.run(deleteIncompatabilities, {
            l1Name: value.license1,
            l2Name: value.license2,
          })
        }
      }
      return insert()
    }
  )
  await Promise.all(inserts)
}
