import { Flex, Text } from '@chakra-ui/react'
import React, { useState } from 'react'
import { useHistory } from 'react-router'

interface LicenseMatrixProps {
  blocks: JSX.Element[],
  licenses: string[],
  editableBlocks: JSX.Element[][]
}

const LicenseMatrix: React.FC<LicenseMatrixProps> = ({
  blocks,
  licenses,
  editableBlocks
}) => {

  return (
        <Flex style={{ marginTop: '24px', overflow: 'auto', maxHeight: '100vh' }}>
          <Flex>
            <Flex flexDir="column">
              <Text
                fontSize="12px"
                as="kbd"
                style={{ width: '100px', height: '50px' }}
              >
                Licenses
              </Text>
              {blocks}
            </Flex>
            <Flex flexDir="column" maxWidth={licenses.length * 100}>
              <Flex flexDir="row">{blocks}</Flex>
              <Flex flexDir="row" flexFlow="wrap">
                {editableBlocks}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
  )
}

export default LicenseMatrix
