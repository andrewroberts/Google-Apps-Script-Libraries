// JSHint - 20200116
/* jshint asi: true */

(function() {"use strict"})()

// GoogleAppsScriptLibraries.gs
// ============================
//
// Dev: AndrewRoberts.net
//
// External interface to this script - all of the event handlers.
//
// This files contains all of the event handlers, plus miscellaneous functions 
// not worthy of their own files yet
//
// The filename is prepended with _API as the Github chrome extension won't 
// push a file with the same name as the project.

var Log_

// Public event handlers
// ---------------------
//
// All external event handlers need to be top-level function calls; they can't 
// be part of an object, and to ensure they are all processed similarily 
// for things like logging and error handling, they all go through 
// errorHandler_(). These can be called from custom menus, web apps, 
// triggers, etc
// 
// The main functionality of a call is in a function with the same name but 
// post-fixed with an underscore (to indicate it is private to the script)
//
// For debug, rather than production builds, lower level functions are exposed
// in the menu

var EVENT_HANDLERS_ = {

//                           Name                            onError Message                          Main Functionality
//                           ----                            ---------------                          ------------------

  onRefresh:                 ['onRefresh()',                 'Failed to refresh',                     onRefresh_],
}

function onRefresh(args) {return eventHandler_(EVENT_HANDLERS_.onRefresh, args)}

// Private Functions
// =================

// General
// -------

/**
 * All external function calls should call this to ensure standard 
 * processing - logging, errors, etc - is always done.
 *
 * @param {Array} config:
 *   [0] {Function} prefunction
 *   [1] {String} eventName
 *   [2] {String} onErrorMessage
 *   [3] {Function} mainFunction
 *
 * @param {Object}   args       The argument passed to the top-level event handler
 */

function eventHandler_(config, args) {

  try {

    var userEmail = Session.getActiveUser().getEmail()

    Log_ = BBLog.getLog({
      level:                DEBUG_LOG_LEVEL_, 
      displayFunctionNames: DEBUG_LOG_DISPLAY_FUNCTION_NAMES_,
      sheetId:              TEST_SHEET_ID_
    })
    
    Log_.info('Handling ' + config[0] + ' from ' + (userEmail || 'unknown email') + ' (' + SCRIPT_NAME + ' ' + SCRIPT_VERSION + ')')
    
    // Call the main function
    return config[2](args)
    
  } catch (error) {
  
    var assertConfig = {
      error:          error,
      userMessage:    config[1],
      log:            Log_,
      handleError:    HANDLE_ERROR_, 
      sendErrorEmail: SEND_ERROR_EMAIL_, 
      emailAddress:   ADMIN_EMAIL_ADDRESS_,
      scriptName:     SCRIPT_NAME,
      scriptVersion:  SCRIPT_VERSION, 
    }

    Assert.handleError(assertConfig) 
  }
  
} // eventHandler_()

// Private event handlers
// ----------------------

function onRefresh_() {

  var spreadsheet = Utils_.getSpreadsheet() 
  var masterSheet = spreadsheet.getSheetByName(MASTER_SHEET_NAME_)
  var output = getMasterLibraryList()
  writeLibraryList(output)
  return
  
  // Private Functions
  // -----------------
  
  function getMasterLibraryList() {  
  
    /*
    [Library 1 Name] : {
      [Key 1]: [Value 1]
      [Key 1]: [Value 1]
      .
      .
      .
    },
    [Library 2 Name] : {
      
    },
    .
    .
    .
    
    */
    var output = {}
    
    SHEETS_.forEach(function(config) {
    
      var sheetName = config.name
      var sheet = spreadsheet.getSheetByName(sheetName)
      var input = sheet.getDataRange().getValues()
      var nameOffset = getNameOffset()
      input.shift() // Remove the header      

      input.forEach(function(row) {
      
        if (row[0] === '') {
          return
        }

        var libraryName = row[nameOffset]

        if (!output.hasOwnProperty(libraryName)) {
          output[libraryName] = {}
        }

        config.columns.forEach(function(column) {        
          var inputOffset = column.offset
          var nextOutputColumnName = column.map
          
          if (nextOutputColumnName === '') {
            return
          }
          
          var nextInputValue = row[inputOffset]
          
          if (nextOutputColumnName !== 'Name') { 
            output[libraryName][nextOutputColumnName] = nextInputValue      
          }        
        })
      })

      // Private Functions
      // -----------------
      
      function getNameOffset() {    
        
        var nameOffset = null
        
        config.columns.some(function(column) {
          if (column.name === 'Name' || column.name === 'name' || column.name === 'Library Name') {
            nameOffset = column.offset
            return true
          }
        })
        
        if (nameOffset === null) {
          throw new Error('Can not find the library names in "' + sheetName + '"')
        }      
        
        return nameOffset
        
      } // onRefresh_.getMasterLibraryList.getNameOffset()
              
      Log_.finest('output: %s', output)
      
    }) // for each sheet
    
    return addJSONLists(output)
    
    // Private Functions
    // -----------------
    
    /** 
     * Map the next library object key stored in the JSON to the 
     * appropriate "master" list key
     */
    
    function addJSONLists(output) {
    
      JSON_.forEach(function(config) {
      
        var url = config.url
        var jSONkeys = config.keys
        var json = JSON.parse(UrlFetchApp.fetch(url).getContentText())
        
        json.forEach(function(jSONlibrary) {
        
          var libraryName = jSONlibrary[jSONkeys[0].name]
          
          if (output[libraryName] === undefined) {
            output[libraryName] = {}
          }
          
          for (var key in jSONkeys) {
          
            if (!jSONkeys.hasOwnProperty(key)) {
              continue
            }
            
            var nextJSONKey = jSONkeys[key] 
            var nextValue = jSONlibrary[nextJSONKey.name]
            
            if (nextValue instanceof Array) {
              nextValue = nextValue.join()
            }
            
            output[libraryName][nextJSONKey.map] = nextValue
          }
        })
      })
      return output
      
    } // // onRefresh_.getMasterLibraryList().addJSONLists()
    
  } // onRefresh_.getMasterLibraryList()
  
  function writeLibraryList(output) {  
  
    var data = []
    var maxOffset = 0
    
    for (var library in output) {
    
      if (!output.hasOwnProperty(library)) {
        continue
      }

      var nextRow = [library] // Initialise the row with the name

      if (!output.hasOwnProperty(library)) {
        continue
      }
      
      var nextLibrary = output[library]
      
      for (var columnName in nextLibrary) {
      
        if (!nextLibrary.hasOwnProperty(columnName)) {
          continue
        }
      
        var offsetIntoMasterList = OFFSETS_[columnName]        
        maxOffset = (offsetIntoMasterList > maxOffset) ? offsetIntoMasterList : maxOffset
        nextRow[offsetIntoMasterList] = nextLibrary[columnName]      
      }
      
      data.push(nextRow)
      
    } // for each library
    
    Log_.fine('maxOffset: ' + maxOffset)
    
    // Replace any null values - use "for" as some indexes may be empty
    data.forEach(function(row, rowIndex) {
      for (var columnIndex = 0; columnIndex <= maxOffset; columnIndex++) {
        var cell = data[rowIndex][columnIndex]
        if (cell === null || cell === undefined) {
          data[rowIndex][columnIndex] = ''
        }
      }
    })
    
    data = data.sort(sortFunction)
    Log_.finest('data: %s', data)
    masterSheet.getRange(2, 1, masterSheet.getLastRow(), OFFSETS_.LAST_OFFSET + 1).clearContent()
    masterSheet.getRange(2, 1, data.length, maxOffset + 1).setValues(data) 
    return
    
    // Private Functions
    // -----------------
          
    function sortFunction(a, b) {
      var la = a[0].toLowerCase()
      var lb = b[0].toLowerCase()
      if (la === lb) {
          return 0;
      } else {
          return (la < lb) ? -1 : 1;
      }      
    } // onRefresh_.writeLibraryList.sortFunction()

  } // onRefresh_.writeLibraryList()
  
} // onRefresh_() 