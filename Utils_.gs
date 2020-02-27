// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - TODO
/* jshint asi: true */

(function() {"use strict"})()

// Utils_.gs
// =========

var Utils_ = (function(ns) {

  /**
   *
   *
   * @param {object} 
   *
   * @return {object}
   */
 
  ns.getSpreadsheet = function() {
  
    var activeSpreadsheet = SpreadsheetApp.getActive()
      
    if (activeSpreadsheet === null) {
      return SpreadsheetApp.openById(TEST_SHEET_ID_)
    } else {
      return activeSpreadsheet
    }
    
  } // Utils_.getSpreadsheet()

  return ns

})(Utils_ || {})
