import React, { useState } from 'react'
// import { Button, Flex, Heading } from '@chakra-ui/react'
import LicenseModelView from './LicenseModelView'
import FileUploadView from './FileUploadView'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import HomeView from './HomeView'
import LicenseModelPickerView from './LicenseModelPickerView'

function App() {
  // const [page, setPage] = useState(0)
  const [licenseIncompatabilities, setLicenseIncompatabilities] = useState({})

  return (
    <Router>
      <Switch>
        <Route path="/upload">
          <FileUploadView licenseIncompatabilities={licenseIncompatabilities} />
        </Route>
        <Route path="/model">
          <LicenseModelView
            setLicenseIncompatabilities={setLicenseIncompatabilities}
          />
        </Route>
        <Route path="/picker">
          <LicenseModelPickerView
            setLicenseIncompatabilities={setLicenseIncompatabilities}
          />
        </Route>
        <Route exact path="/">
          <HomeView></HomeView>
        </Route>
      </Switch>
    </Router>
  )
}

export default App
