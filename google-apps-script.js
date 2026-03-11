// Cole este código no Google Apps Script (Extensões → Apps Script)
// Depois faça: Implantar → Nova implantação → App da Web
// Executar como: Eu | Acesso: Qualquer pessoa

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Cria cabeçalho se a planilha estiver vazia
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Nome', 'Email', 'Empresa', 'Origem', 'Idioma', 'Resultado', 'Data']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  sheet.appendRow([
    data.name || '',
    data.email,
    data.company || '',
    data.source,
    data.lang,
    data.result || '',
    data.date
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
