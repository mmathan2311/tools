// Shared script for calculators (EMI, GST, SIP, BMI, Age)
// EMI logic
(function(){  
  // helper
  function formatCurrency(v){ return Number(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function $(id){ return document.getElementById(id); }

  // EMI
  let emiTable=null, emiChart=null;
  if($('emi-calc')){
    $('emi-calc').addEventListener('click',()=>{
      const P = parseFloat($('emi-principal').value||0);
      const annualRate = parseFloat($('emi-rate').value||0);
      const years = parseFloat($('emi-years').value||0);
      const n = Math.round(years*12);
      const r = annualRate/100/12;
      if(!P || !n || r<0){ alert('Please enter valid inputs'); return; }
      const EMI = r===0 ? P/n : (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      const totalPay = EMI * n;
      const totalInterest = totalPay - P;
      const res = $('emi-result'); res.style.display='block';
      res.innerHTML = `<div><strong>EMI:</strong> ₹${formatCurrency(EMI)}</div><div class="small">Total Interest: ₹${formatCurrency(totalInterest)} • Total Payment: ₹${formatCurrency(totalPay)}</div>`;
      // amortization
      let bal=P; const table=[];
      for(let i=1;i<=n;i++){ const interest = bal*r; const principal = EMI - interest; bal = Math.max(0, bal-principal); table.push({month:i,emi:EMI,principal,interest,balance:bal}); }
      emiTable = table;
      // chart
      const labels = table.map(x=>x.month);
      const cumulativePrincipal = table.map((t,i)=> table.slice(0,i+1).reduce((s,x)=>s+x.principal,0));
      const cumulativeInterest = table.map((t,i)=> table.slice(0,i+1).reduce((s,x)=>s+x.interest,0));
      const ctx = $('emi-chart').getContext('2d'); if(emiChart) emiChart.destroy();
      emiChart = new Chart(ctx,{type:'line',data:{labels, datasets:[{label:'Principal',data:cumulativePrincipal,borderColor:'#0b78b6',tension:0.2},{label:'Interest',data:cumulativeInterest,borderColor:'#7c3aed',tension:0.2}]},options:{responsive:true,plugins:{legend:{display:true}}}});
      // table wrapper
      const wrap = $('emi-table-wrap'); let html=`<div style="overflow:auto"><table><thead><tr><th>Month</th><th>EMI</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>`;
      for(let i=0;i<table.length;i++){ if(i<12||i===table.length-1){ const r=table[i]; html+=`<tr><td>${r.month}</td><td>₹${formatCurrency(r.emi)}</td><td>₹${formatCurrency(r.principal)}</td><td>₹${formatCurrency(r.interest)}</td><td>₹${formatCurrency(r.balance)}</td></tr>`;} else if(i===12){ html+=`<tr><td colspan="5" class="small">...Showing first 12 months and final month. Download CSV for full table.</td></tr>`; } }
      html += '</tbody></table></div>'; wrap.innerHTML = html;
    });

    // CSV download
    $('emi-download').addEventListener('click',()=>{
      if(!emiTable){ alert('Generate EMI first'); return; }
      const rows=[['Month','EMI','Principal','Interest','Balance']]; emiTable.forEach(r=>rows.push([r.month,r.emi.toFixed(2),r.principal.toFixed(2),r.interest.toFixed(2),r.balance.toFixed(2)]));
      const csv = rows.map(r=>r.join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='emi_amortization.csv'; a.click(); URL.revokeObjectURL(url);
    });
  }

  // GST
  if($('gst-calc')){
    $('gst-calc').addEventListener('click',()=>{
      const amount = parseFloat($('gst-amount').value||0); const rate = parseFloat($('gst-rate').value||0); const type = $('gst-type').value;
      const totalTax = amount * rate / 100; let cgst=0,sgst=0,igst=0; if(type==='intra'){ cgst=totalTax/2; sgst=totalTax/2; } else { igst=totalTax; }
      const total = amount + totalTax; $('gst-result').style.display='block'; $('gst-result').innerHTML = `<div><strong>Net Amount:</strong> ₹${formatCurrency(amount)}</div><div><strong>GST (${rate}%):</strong> ₹${formatCurrency(totalTax)}</div>${type==='intra'?`<div><strong>CGST:</strong> ₹${formatCurrency(cgst)} &nbsp; <strong>SGST:</strong> ₹${formatCurrency(sgst)}</div>`:`<div><strong>IGST:</strong> ₹${formatCurrency(igst)}</div>`}<div style="margin-top:8px"><strong>Total Price:</strong> ₹${formatCurrency(total)}</div>`;
    });
    $('gst-reverse').addEventListener('click',()=>{ const total = parseFloat(prompt('Enter total (amount + GST) in ₹','1180'))||0; const rate = parseFloat($('gst-rate').value||0); const type = $('gst-type').value; const base = total / (1 + rate/100); const tax = total - base; let cgst=0,sgst=0,igst=0; if(type==='intra'){ cgst=tax/2; sgst=tax/2; } else { igst = tax; } $('gst-result').style.display='block'; $('gst-result').innerHTML = `<div><strong>Total:</strong> ₹${formatCurrency(total)}</div><div><strong>Base Amount:</strong> ₹${formatCurrency(base)}</div><div><strong>GST (${rate}%):</strong> ₹${formatCurrency(tax)}</div>${type==='intra'?`<div><strong>CGST:</strong> ₹${formatCurrency(cgst)} &nbsp; <strong>SGST:</strong> ₹${formatCurrency(sgst)}</div>`:`<div><strong>IGST:</strong> ₹${formatCurrency(igst)}</div>`}`; });
  }

  // SIP
  let sipTable=null, sipChart=null;
  if($('sip-calc')){
    $('sip-calc').addEventListener('click',()=>{
      const monthly = parseFloat($('sip-monthly').value||0); const annual = parseFloat($('sip-rate').value||0); const years = parseFloat($('sip-years').value||0);
      if(!monthly||!annual||!years){ alert('Enter valid inputs'); return; }
      const mRate = annual/100/12; const months = years*12; const factor = (Math.pow(1+mRate, months)-1)/mRate; const futureValue = monthly * factor * (1+mRate); const totalInvested = monthly * months; const totalGain = futureValue - totalInvested;
      $('sip-result').style.display='block'; $('sip-result').innerHTML = `<div><strong>Future Value:</strong> ₹${formatCurrency(futureValue)}</div><div class="small">Total Invested: ₹${formatCurrency(totalInvested)} • Total Gain: ₹${formatCurrency(totalGain)}</div>`;
      // monthly breakdown for chart
      let balance = 0; const data = [];
      for(let i=1;i<=months;i++){ balance = (balance + monthly) * (1 + mRate); if(i%12===0||i===1||i===months) data.push({month:i,balance}); }
      sipTable = []; balance=0; for(let i=1;i<=months;i++){ balance=(balance+monthly)*(1+mRate); sipTable.push({month:i,balance}); }
      const labels = data.map(d=>d.month); const values = data.map(d=>d.balance); const ctx = $('sip-chart').getContext('2d'); if(sipChart) sipChart.destroy(); sipChart = new Chart(ctx,{type:'line',data:{labels, datasets:[{label:'Portfolio Value',data:values,borderColor:'#0b78b6',tension:0.2}]},options:{responsive:true}});
      // table
      let wrap = $('sip-table-wrap'); let html=`<div style="overflow:auto"><table><thead><tr><th>Month</th><th>Balance</th></tr></thead><tbody>`; data.forEach(r=> html+=`<tr><td>${r.month}</td><td>₹${formatCurrency(r.balance)}</td></tr>`); html += '</tbody></table></div>'; wrap.innerHTML = html;
    });

    $('sip-download').addEventListener('click',()=>{ if(!sipTable||sipTable.length===0){ alert('Generate SIP first'); return; } const rows=[['Month','Balance']]; sipTable.forEach(r=>rows.push([r.month,r.balance.toFixed(2)])); const csv=rows.map(r=>r.join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sip_table.csv'; a.click(); URL.revokeObjectURL(url); });
  }

  // BMI
  if($('bmi-calc')){
    $('bmi-calc').addEventListener('click',()=>{
      const w=parseFloat($('bmi-weight').value||0); const hcm=parseFloat($('bmi-height').value||0); if(!w||!hcm){ alert('Enter valid weight & height'); return; }
      const h = hcm/100; const bmi = w/(h*h); let cat=''; if(bmi<18.5) cat='Underweight'; else if(bmi<24.9) cat='Normal weight'; else if(bmi<29.9) cat='Overweight'; else cat='Obesity'; $('bmi-result').style.display='block'; $('bmi-result').innerHTML = `<div><strong>BMI:</strong> ${bmi.toFixed(2)}</div><div class="small">Category: ${cat}</div>`; });
  }

  // Age
  if($('age-calc')){
    $('age-now').addEventListener('click',()=>{ const today=new Date(); $('compare-date').value = today.toISOString().slice(0,10); });
    $('age-calc').addEventListener('click',()=>{ const dobv=$('dob').value; let cmp = $('compare-date').value; if(!dobv){ alert('Select date of birth'); return; } const dob=new Date(dobv); const today = cmp? new Date(cmp): new Date(); if(dob>today){ alert('DOB cannot be in future'); return; } let y=today.getFullYear()-dob.getFullYear(); let m=today.getMonth()-dob.getMonth(); let d=today.getDate()-dob.getDate(); if(d<0){ m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); } if(m<0){ y--; m+=12; } $('age-result').style.display='block'; $('age-result').innerHTML = `<div><strong>Age:</strong> ${y} years, ${m} months, ${d} days</div><div class="small">From ${dob.toLocaleDateString()} to ${today.toLocaleDateString()}</div>`; });
  }
})();