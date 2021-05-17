import React, { Dispatch, SetStateAction, useRef } from 'react'
import { CSVReader } from 'react-papaparse'
import { Button } from '@chakra-ui/react'
import { cantorPair, licenseIncompatability } from './LicenseModelView';
import { useHistory } from 'react-router';

interface row {
  data: string[]
}

interface UploadCSVProps {
  onUpload: (licenseIncompatibilities: { [id: number]: licenseIncompatability}) => void
}

const UploadCSV: React.FC<UploadCSVProps> = ({
  onUpload
}) => {
  const buttonRef = useRef<CSVReader>(null)

  const handleOpenDialog = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Note that the ref is set async, so it might be null at some point
    if (buttonRef.current) {
      buttonRef.current.open(e)
    }
  }

  const handleOnFileLoad = (data: row[], file?: File) => {
    const licenseIncompatibilities: { [id: number]: licenseIncompatability} = {}
    for (let i = 1; i < data.length; i++) {
      const column = data[i]

      for (let j = 1; j < column.data.length; j++) {
        const row = column.data[j]

        const id = cantorPair(i, j)
        if (!licenseIncompatibilities[id]) {
          licenseIncompatibilities[id] = {
            id: id,
            license1: data[0].data[j],
            license2: data[i].data[0],
            incompatible: row === 'Y' ? true : false,
          }
        }
      }
    }

    console.log(licenseIncompatibilities)
    onUpload(licenseIncompatibilities)
  }

  return (
    <>
      <CSVReader
        ref={buttonRef}
        onFileLoad={handleOnFileLoad}
        noClick
        noProgressBar
        noDrag
      >
        {() => (
          <>
            <Button
              mt="24px"
              type="button"
              size="lg"
              colorScheme="green"
              style={{ marginRight: '12px' }}
              onClick={handleOpenDialog}
            >
              Upload CSV
            </Button>
          </>
        )}
      </CSVReader>
    </>
  )
}

export default UploadCSV
