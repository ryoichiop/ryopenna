// Codigo real implantado no Google Apps Script
// Projeto: PROMPT - Livro Leads
// Implantar → Gerenciar implantacoes → Editar → Nova versao → Implantar

function doPost(e) {
  var sheet = SpreadsheetApp.openById(getOrCreateSheet_()).getSheetByName('Leads');
  var data = JSON.parse(e.postData.contents);
  var timestamp = new Date().toISOString();

  sheet.appendRow([
    timestamp,
    data.name || '',
    data.email || '',
    data.company || '',
    data.linkedin || '',
    data.source || '',
    data.lang || '',
    data.result || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) {
    try { SpreadsheetApp.openById(id); return id; } catch(e) {}
  }
  var ss = SpreadsheetApp.create('PROMPT - Leads do Livro');
  var sheet = ss.getActiveSheet();
  sheet.setName('Leads');
  sheet.appendRow(['Data/Hora', 'Nome', 'E-mail', 'Empresa', 'LinkedIn', 'Origem', 'Idioma', 'Resultado']);
  sheet.setFrozenRows(1);
  sheet.getRange('1:1').setFontWeight('bold');
  props.setProperty('SHEET_ID', ss.getId());
  Logger.log('Planilha criada: ' + ss.getUrl());
  return ss.getId();
}

function setup() {
  var id = getOrCreateSheet_();
  var ss = SpreadsheetApp.openById(id);
  Logger.log('Planilha pronta: ' + ss.getUrl());
}
