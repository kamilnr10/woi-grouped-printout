/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */ 
 define(['N/currentRecord', 'N/https', 'N/search', 'N/record', 'N/url'],
 function (currentRecord, https, search, record, url) {
     let exports = {};
     let woiIds = [];
     function goToNextCase() {
         var currentRec = currentRecord.get();
         var numLines = currentRec.getLineCount({
             sublistId: 'sublist'
         });
         const addQuoteToItem = (itemsArray) => {
             let arrayOfWords = [];
             itemsArray.forEach((item) => {
                 let txt ="'";
                 txt += item + "'";
             
                 arrayOfWords.push(txt);
             })
             return arrayOfWords
         }
 
         for (let i = 0; i < numLines; i++) {
             let lineIdValue = currentRec.getSublistValue({
                 sublistId: 'sublist',
                 fieldId: 'sublist2',
                 line: i
             });
             let checkboxLineValue = currentRec.getSublistValue({
                 sublistId: 'sublist',
                 fieldId: 'custpage_id',
                 line: i
             });
         if (checkboxLineValue) {
             woiIds.push(lineIdValue);
             }
         };
 
         const woiIdsTxt = addQuoteToItem(woiIds).toString();
         alert(woiIdsTxt);
         

        var output = url.resolveScript({
            scriptId: 'customscript1246',
            deploymentId: 'customdeploy1',
            returnExternalUrl: false,
            params: {
                items_id: JSON.stringify(woiIds),
            }
        });
        window.open(output, '_blank');
        woiIds = [];
     }
     exports.goToNextCase = goToNextCase;
     return exports
 })