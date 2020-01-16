// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// Tests.gs
// ========
//
// Dev: AndrewRoberts.net
//
// Code for internal/unit testing

function test_init() {
  Log_ = BBLog.getLog({
    sheetId:              TEST_SHEET_ID_,
    level:                BBLog.Level.FINER, 
    displayFunctionNames: BBLog.DisplayFunctionNames.NO,
  })  
}

function test_misc() {
  // ...
}

function test_onRefresh() {
  test_init()
  onRefresh_()
}