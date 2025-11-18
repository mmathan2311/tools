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

  // HTML Beautifier
  if($('html-beautify')){
    function beautifyHTML(html){
      let formatted=''; let indent=0; const tab='  ';
      const lines = html.split(/>\s*</g);
      lines.forEach((line,i)=>{
        if(line.match(/^\/\w/) || line.match(/^br/) || line.match(/^img/) || line.match(/^input/)) indent--;
        formatted += tab.repeat(Math.max(0,indent)) + '<' + line + '>\n';
        if(line[0]!=='/' && !line.match(/br|img|input|hr|meta|link/) && !line.match(/\/\s*>$/)) indent++;
      });
      return formatted.replace(/>\n</g,'><').trim();
    }
    $('html-beautify').addEventListener('click',()=>{
      const input=$('html-input').value.trim();
      if(!input){ alert('Enter HTML'); return; }
      try { const beautified=beautifyHTML(input); $('html-output').value=beautified; $('html-status').textContent='✓ Formatted'; } catch(e){ $('html-status').textContent='Error: '+e.message; }
    });
    $('html-minify').addEventListener('click',()=>{
      const input=$('html-input').value;
      if(!input){ alert('Enter HTML'); return; }
      const minified=input.replace(/>\s+</g,'><').replace(/\s+/g,' ').trim();
      $('html-output').value=minified;
      $('html-status').textContent='✓ Minified (' + minified.length + ' chars)';
    });
    $('html-copy').addEventListener('click',()=>{
      const text=$('html-output').value;
      if(!text){ alert('Nothing to copy'); return; }
      navigator.clipboard.writeText(text).then(()=>{ $('html-status').textContent='✓ Copied'; setTimeout(()=>$('html-status').textContent='',2000); });
    });
    $('html-clear').addEventListener('click',()=>{
      $('html-input').value=''; $('html-output').value=''; $('html-status').textContent='';
    });
  }

  // Base64 Encoder/Decoder
  if($('b64-encode')){
    $('b64-encode').addEventListener('click',()=>{
      const text=$('b64-input').value;
      if(!text){ alert('Enter text'); return; }
      try { const encoded=btoa(unescape(encodeURIComponent(text))); $('b64-output').value=encoded; $('b64-status').textContent='✓ Encoded'; } catch(e){ $('b64-status').textContent='Error: '+e.message; }
    });
    $('b64-decode').addEventListener('click',()=>{
      const text=$('b64-input').value.trim();
      if(!text){ alert('Enter Base64'); return; }
      try { const decoded=decodeURIComponent(escape(atob(text))); $('b64-output').value=decoded; $('b64-status').textContent='✓ Decoded'; } catch(e){ $('b64-status').textContent='Error: Invalid Base64'; }
    });
    $('b64-copy').addEventListener('click',()=>{
      const text=$('b64-output').value;
      if(!text){ alert('Nothing to copy'); return; }
      navigator.clipboard.writeText(text).then(()=>{ $('b64-status').textContent='✓ Copied'; setTimeout(()=>$('b64-status').textContent='',2000); });
    });
    $('b64-clear').addEventListener('click',()=>{
      $('b64-input').value=''; $('b64-output').value=''; $('b64-status').textContent='';
    });
  }

  // Stopwatch & Timer
  if($('tab-stopwatch')){
    let swRunning=false, swTime=0, swInterval=null;
    let tmRunning=false, tmTime=0, tmInterval=null;
    const formatTime=(ms)=>{ const h=Math.floor(ms/3600000); const m=Math.floor((ms%3600000)/60000); const s=Math.floor((ms%60000)/1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
    const updateDisplay=()=>{ $('stopwatch-display').textContent=formatTime(swTime); };
    
    $('tab-stopwatch').addEventListener('click',()=>{ $('stopwatch-mode').classList.add('active'); $('timer-mode').classList.remove('active'); $('tab-stopwatch').classList.add('active'); $('tab-timer').classList.remove('active'); });
    $('tab-timer').addEventListener('click',()=>{ $('timer-mode').classList.add('active'); $('stopwatch-mode').classList.remove('active'); $('tab-timer').classList.add('active'); $('tab-stopwatch').classList.remove('active'); });

    // Stopwatch
    $('sw-start').addEventListener('click',()=>{ if(!swRunning){ swRunning=true; const start=Date.now()-swTime; swInterval=setInterval(()=>{ swTime=Date.now()-start; updateDisplay(); },10); } });
    $('sw-pause').addEventListener('click',()=>{ swRunning=false; clearInterval(swInterval); });
    $('sw-reset').addEventListener('click',()=>{ swRunning=false; swTime=0; clearInterval(swInterval); updateDisplay(); });

    // Timer
    const setTimerDisplay=()=>{ const h=+$('timer-hours').value||0; const m=+$('timer-minutes').value||0; const s=+$('timer-seconds').value||0; tmTime=(h*3600+m*60+s)*1000; $('timer-display').textContent=formatTime(tmTime); };
    const updateTimerDisplay=()=>{ $('timer-display').textContent=formatTime(Math.max(0,tmTime)); };
    
    $('timer-hours').addEventListener('change',setTimerDisplay);
    $('timer-minutes').addEventListener('change',setTimerDisplay);
    $('timer-seconds').addEventListener('change',setTimerDisplay);

    $('tm-start').addEventListener('click',()=>{ if(!tmRunning && tmTime>0){ tmRunning=true; const start=Date.now(); const initialTime=tmTime; tmInterval=setInterval(()=>{ tmTime=initialTime-(Date.now()-start); if(tmTime<=0){ tmTime=0; updateTimerDisplay(); clearInterval(tmInterval); tmRunning=false; new Audio('data:audio/wav;base64,UklGRmYBAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIBAAAAAA==').play(); } else { updateTimerDisplay(); } },10); } });
    $('tm-pause').addEventListener('click',()=>{ tmRunning=false; clearInterval(tmInterval); });
    $('tm-reset').addEventListener('click',()=>{ tmRunning=false; tmTime=0; clearInterval(tmInterval); setTimerDisplay(); });
    
    setTimerDisplay();
  }

  // URL Encoder/Decoder
  if($('url-encode')){
    $('url-encode').addEventListener('click',()=>{
      const text=$('url-input').value;
      if(!text){ alert('Enter text'); return; }
      try { const encoded=encodeURIComponent(text); $('url-output').value=encoded; $('url-status').textContent='✓ Encoded'; } catch(e){ $('url-status').textContent='Error: '+e.message; }
    });
    $('url-decode').addEventListener('click',()=>{
      const text=$('url-input').value;
      if(!text){ alert('Enter URL'); return; }
      try { const decoded=decodeURIComponent(text); $('url-output').value=decoded; $('url-status').textContent='✓ Decoded'; } catch(e){ $('url-status').textContent='Error: Invalid URL'; }
    });
    $('url-copy').addEventListener('click',()=>{
      const text=$('url-output').value;
      if(!text){ alert('Nothing to copy'); return; }
      navigator.clipboard.writeText(text).then(()=>{ $('url-status').textContent='✓ Copied'; setTimeout(()=>$('url-status').textContent='',2000); });
    });
    $('url-clear').addEventListener('click',()=>{
      $('url-input').value=''; $('url-output').value=''; $('url-status').textContent='';
    });
  }

  // Word Counter
  if($('word-text')){
    const updateStats=()=>{
      const text=$('word-text').value;
      const words=text.trim()?text.trim().split(/\s+/).length:0;
      const chars=text.length;
      const charsNoSpace=text.replace(/\s/g,'').length;
      const sentences=text.split(/[.!?]+/).filter(s=>s.trim()).length;
      const paragraphs=text.split(/\n\n+/).filter(p=>p.trim()).length;
      const lines=text.split('\n').length;
      const readingTime=Math.ceil(words/200);
      const avgWordLength=words>0?(charsNoSpace/words).toFixed(2):0;
      $('stat-words').textContent=words;
      $('stat-chars').textContent=chars;
      $('stat-chars-no-space').textContent=charsNoSpace;
      $('stat-sentences').textContent=sentences;
      $('stat-paragraphs').textContent=paragraphs;
      $('stat-lines').textContent=lines;
      $('stat-reading-time').textContent=(readingTime>0?readingTime+' min':'< 1 min');
      $('stat-avg-word-length').textContent=avgWordLength;
    };
    $('word-text').addEventListener('input',updateStats);
    $('wc-copy-stats').addEventListener('click',()=>{
      const stats='Words: '+$('stat-words').textContent+'\nCharacters: '+$('stat-chars').textContent+'\nChars (no space): '+$('stat-chars-no-space').textContent+'\nSentences: '+$('stat-sentences').textContent+'\nParagraphs: '+$('stat-paragraphs').textContent+'\nLines: '+$('stat-lines').textContent+'\nReading Time: '+$('stat-reading-time').textContent;
      navigator.clipboard.writeText(stats);
    });
    $('wc-clear').addEventListener('click',()=>{
      $('word-text').value=''; updateStats();
    });
    updateStats();
  }

  // XML Formatter
  if($('xml-format')){
    function formatXML(xml){
      try {
        const parser=new DOMParser(); const doc=parser.parseFromString(xml,'text/xml');
        if(doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML');
        function formatNode(node, depth=0){
          const indent='\n'+'  '.repeat(depth);
          let result='';
          for(let i=0; i<node.childNodes.length; i++){
            const child=node.childNodes[i];
            if(child.nodeType===1) result+=indent+'<'+child.nodeName;
            if(child.attributes) for(let j=0; j<child.attributes.length; j++) { const attr=child.attributes[j]; result+=' '+attr.name+'="'+attr.value+'"'; }
            if(child.nodeType===1){
              let hasChildren=false;
              for(let k=0; k<child.childNodes.length; k++){
                const n=child.childNodes[k];
                if(n.nodeType===1 || (n.nodeType===3 && n.data.trim())) { hasChildren=true; break; }
              }
              if(hasChildren) result+='>' + formatNode(child, depth+1) + indent + '</' + child.nodeName + '>';
              else result+=' />';
            } else if(child.nodeType===3 && child.data.trim()) result+=child.data.trim();
          }
          return result;
        }
        return formatNode(doc.documentElement);
      } catch(e){ throw new Error('XML Parse Error: '+e.message); }
    }
    $('xml-format').addEventListener('click',()=>{
      const input=$('xml-input').value.trim();
      if(!input){ alert('Enter XML'); return; }
      try { const formatted=formatXML(input); $('xml-output').value=formatted; $('xml-status').textContent='✓ Valid & Formatted'; } catch(e){ $('xml-status').textContent='✗ '+e.message; }
    });
    $('xml-minify').addEventListener('click',()=>{
      const input=$('xml-input').value;
      if(!input){ alert('Enter XML'); return; }
      try { const minified=input.replace(/>\s+</g,'><').replace(/\s+/g,' ').trim(); $('xml-output').value=minified; $('xml-status').textContent='✓ Minified'; } catch(e){ $('xml-status').textContent='Error'; }
    });
    $('xml-validate').addEventListener('click',()=>{
      const input=$('xml-input').value.trim();
      if(!input){ alert('Enter XML'); return; }
      try { formatXML(input); $('xml-status').textContent='✓ Valid XML'; } catch(e){ $('xml-status').textContent='✗ Invalid: '+e.message; }
    });
    $('xml-copy').addEventListener('click',()=>{
      const text=$('xml-output').value;
      if(!text){ alert('Nothing to copy'); return; }
      navigator.clipboard.writeText(text).then(()=>{ $('xml-status').textContent='✓ Copied'; setTimeout(()=>$('xml-status').textContent='',2000); });
    });
    $('xml-clear').addEventListener('click',()=>{
      $('xml-input').value=''; $('xml-output').value=''; $('xml-status').textContent='';
    });
  }

  // UUID Generator
  if($('uuid-generate')){
    const generateUUID=()=>{ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=> { const r=Math.random()*16|0; const v=c==='x'?r:(r&0x3|0x8); return v.toString(16); }); };
    
    $('uuid-generate').addEventListener('click',()=>{
      const uuid=generateUUID();
      $('uuid-value').textContent=uuid;
      $('uuid-display').style.display='flex';
    });

    $('uuid-copy-btn').addEventListener('click',()=>{
      const uuid=$('uuid-value').textContent;
      navigator.clipboard.writeText(uuid).then(()=>{ $('uuid-copy-btn').textContent='Copied!'; setTimeout(()=>$('uuid-copy-btn').textContent='Copy',2000); });
    });

    let batchUUIDs=[];
    $('batch-generate').addEventListener('click',()=>{
      const count=Math.min(parseInt($('batch-count').value)||5, 100);
      batchUUIDs=[];
      for(let i=0;i<count;i++) batchUUIDs.push(generateUUID());
      const list=$('uuid-list');
      list.innerHTML=batchUUIDs.map((u,i)=>`<div class="uuid-item"><span>${u}</span><button onclick="navigator.clipboard.writeText('${u}')">Copy</button></div>`).join('');
      list.style.display='block';
    });

    $('batch-copy-all').addEventListener('click',()=>{
      if(!batchUUIDs.length){ alert('Generate UUIDs first'); return; }
      navigator.clipboard.writeText(batchUUIDs.join('\n')).then(()=>{ $('batch-copy-all').textContent='Copied!'; setTimeout(()=>$('batch-copy-all').textContent='Copy All',2000); });
    });

    $('batch-clear').addEventListener('click',()=>{
      batchUUIDs=[]; $('uuid-list').innerHTML=''; $('uuid-list').style.display='none'; $('batch-count').value='5';
    });
  }

  // Character Counter
  if($('char-text')){
    const updateCharStats=()=>{
      const text=$('char-text').value;
      const totalChars=text.length;
      const uniqueChars=new Set(text).size;
      const letters=text.match(/[a-zA-Z]/g)?.length||0;
      const digits=text.match(/[0-9]/g)?.length||0;
      const spaces=(text.match(/\s/g)||[]).length;
      const special=totalChars-letters-digits-spaces;

      $('stat-total-chars').textContent=totalChars;
      $('stat-unique-chars').textContent=uniqueChars;
      $('stat-letters').textContent=letters;
      $('stat-digits').textContent=digits;
      $('stat-spaces').textContent=spaces;
      $('stat-special').textContent=special;

      // Frequency analysis
      const freq={}; for(const c of text) freq[c]=(freq[c]||0)+1;
      const sorted=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,20);

      let html='';
      if(sorted.length===0) html='<tr><td colspan="4" style="text-align:center; color:#44566b;">No characters found</td></tr>';
      else sorted.forEach(([char,count])=>{
        const pct=((count/totalChars)*100).toFixed(1);
        const barWidth=Math.max(30, (count/sorted[0][1])*200);
        const display=char===' '?'[space]':char==='\n'?'[newline]':char==='\t'?'[tab]':char;
        html+=`<tr><td><span class="char-display">${display}</span></td><td>${count}</td><td>${pct}%</td><td><div class="freq-bar" style="width:${barWidth}px">${pct}%</div></td></tr>`;
      });
      $('frequency-body').innerHTML=html;

      // Letters only
      const letterFreq={};
      for(const c of text.toLowerCase().match(/[a-z]/g)||[]) letterFreq[c]=(letterFreq[c]||0)+1;
      const sortedLetters=Object.entries(letterFreq).sort((a,b)=>b[1]-a[1]);
      let letterHtml='';
      if(sortedLetters.length===0) letterHtml='<tr><td colspan="4" style="text-align:center; color:#44566b;">No letters found</td></tr>';
      else sortedLetters.forEach(([char,count])=>{
        const pct=((count/letters)*100).toFixed(1);
        const barWidth=Math.max(30, (count/sortedLetters[0][1])*200);
        letterHtml+=`<tr><td><span class="char-display">${char}</span></td><td>${count}</td><td>${pct}%</td><td><div class="freq-bar" style="width:${barWidth}px">${pct}%</div></td></tr>`;
      });
      $('alpha-body').innerHTML=letterHtml;

      // Digits only
      const digitFreq={};
      for(const c of text.match(/[0-9]/g)||[]) digitFreq[c]=(digitFreq[c]||0)+1;
      const sortedDigits=Object.entries(digitFreq).sort((a,b)=>b[1]-a[1]);
      let digitHtml='';
      if(sortedDigits.length===0) digitHtml='<tr><td colspan="4" style="text-align:center; color:#44566b;">No digits found</td></tr>';
      else sortedDigits.forEach(([char,count])=>{
        const pct=((count/digits)*100).toFixed(1);
        const barWidth=Math.max(30, (count/sortedDigits[0][1])*200);
        digitHtml+=`<tr><td><span class="char-display">${char}</span></td><td>${count}</td><td>${pct}%</td><td><div class="freq-bar" style="width:${barWidth}px">${pct}%</div></td></tr>`;
      });
      $('digits-body').innerHTML=digitHtml;
    };

    $('char-text').addEventListener('input',updateCharStats);

    // Tab switching
    $('tab-frequency').addEventListener('click',()=>{
      $('freq-content').classList.add('active');
      $('alpha-content').classList.remove('active');
      $('digits-content').classList.remove('active');
      $('tab-frequency').classList.add('active');
      $('tab-alpha').classList.remove('active');
      $('tab-digits').classList.remove('active');
    });

    $('tab-alpha').addEventListener('click',()=>{
      $('alpha-content').classList.add('active');
      $('freq-content').classList.remove('active');
      $('digits-content').classList.remove('active');
      $('tab-alpha').classList.add('active');
      $('tab-frequency').classList.remove('active');
      $('tab-digits').classList.remove('active');
    });

    $('tab-digits').addEventListener('click',()=>{
      $('digits-content').classList.add('active');
      $('freq-content').classList.remove('active');
      $('alpha-content').classList.remove('active');
      $('tab-digits').classList.add('active');
      $('tab-frequency').classList.remove('active');
      $('tab-alpha').classList.remove('active');
    });

    $('cc-copy-stats').addEventListener('click',()=>{
      const stats=`Total Characters: ${$('stat-total-chars').textContent}\nUnique Characters: ${$('stat-unique-chars').textContent}\nLetters: ${$('stat-letters').textContent}\nDigits: ${$('stat-digits').textContent}\nSpaces: ${$('stat-spaces').textContent}\nSpecial Characters: ${$('stat-special').textContent}`;
      navigator.clipboard.writeText(stats);
    });

    $('cc-clear').addEventListener('click',()=>{
      $('char-text').value=''; updateCharStats();
    });

    updateCharStats();
  }
})();

// Hamburger Menu
// Hamburger Menu
(function(){
  function $q(sel){ return document.querySelector(sel); }
  function $qa(sel){ return document.querySelectorAll(sel); }
  
  const menuToggle = $q('.menu-toggle');
  const sidebar = $q('.sidebar-menu');
  const overlay = $q('.sidebar-overlay');
  const menuLinks = $qa('.sidebar-menu a');
  
  if(!menuToggle || !sidebar || !overlay) return;
  
  // Toggle menu on mobile only
 menuToggle.addEventListener('click',()=>{
    if(sidebar.classList.contains('active')){
        closeSidebar();
    } else {
        openSidebar();
    }
});
  
  // Close menu on link click (mobile only)
  menuLinks.forEach(link=>{
    link.addEventListener('click',()=>{
      if(window.innerWidth <= 768){
        menuToggle.classList.remove('active');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      }
    });
  });
  
  // Close menu on overlay click
  overlay.addEventListener('click',()=>{
    menuToggle.classList.remove('active');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
  
  // Close menu on Escape key
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape' && sidebar.classList.contains('active')){
      menuToggle.classList.remove('active');
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
})();

// Sidebar close button & ESC support
document.addEventListener('DOMContentLoaded', function(){
  const sidebarClose = document.querySelector('.sidebar-close');
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar-menu');
  const overlay = document.querySelector('.sidebar-overlay');
  function closeSidebar(){
    if(menuToggle) menuToggle.classList.remove('active');
    if(sidebar) sidebar.classList.remove('active');
    if(overlay) overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  }
  if(sidebarClose){
    sidebarClose.addEventListener('click', closeSidebar);
  }
  // close on ESC
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeSidebar();
  });
  // when sidebar becomes active on desktop, add body class for layout shift
  const observer = new MutationObserver(function(muts){
    muts.forEach(m=>{
      if(m.target.classList && m.target.classList.contains('sidebar-menu')){
        if(m.target.classList.contains('active')){
          document.body.classList.add('sidebar-open');
        } else {
          document.body.classList.remove('sidebar-open');
        }
      }
    });
  });
  const sb = document.querySelector('.sidebar-menu');
  if(sb) observer.observe(sb, {attributes:true,attributeFilter:['class']});
});

