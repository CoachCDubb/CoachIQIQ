// Print a normal document, outside the scrollable modal and its top layer.
export function prepareReportPrint(doc=document){
  doc.getElementById('printReportRoot')?.remove();
  const dialog=doc.getElementById('modal');if(!dialog?.open)return null;
  const root=doc.createElement('article');root.id='printReportRoot';
  const heading=dialog.querySelector('header > div');if(heading)root.append(heading.cloneNode(true));
  const body=doc.getElementById('modalBody').cloneNode(true);body.removeAttribute('id');root.append(body);
  root.querySelectorAll('details').forEach(details=>details.open=true);
  root.querySelectorAll('button,input,select,textarea,.no-print,.form-footer').forEach(control=>control.remove());
  root.querySelectorAll('[id]').forEach(element=>element.removeAttribute('id'));
  doc.body.append(root);return root;
}
export function clearReportPrint(doc=document){doc.getElementById('printReportRoot')?.remove();}
