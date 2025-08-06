function get_principal(i, x, N) {
    if (i == 0) {
        return (x * N);
    }
    else {
        return x / i * (-1 + Math.pow((1 + i), N)) / Math.pow((1 + i), N);
    }
}

function get_annuity(i, P, N) {
    if (i == 0) {
        return Math.round(P / N);
    }
    else {
        return i * P * Math.pow((1 + i), N) / (-1 + Math.pow((1 + i), N));
    }
}

function get_term(i, x, P) {
    if (i == 0) {
        return P / x;
    }
    else {
        return Math.log(x / (x - i * P)) / Math.log(1 + i);
    }
}

function get_interest_rate(x, P, N) {
    var i = 1.0;
    var rat_tol = 0.00000001;
    function f(i, x, P, N) {
        return i * P / x + 1 / Math.pow((i + 1), N) - 1;
    }
    function f_(i, x, P, N) {
        return P / x - N / Math.pow((i + 1), (N + 1));
    }
    function f_rat(i, x, P, N) {
        return f(i, x, P, N) / f_(i, x, P, N);
    }
    for (let j = 1; j < 1000; j++) {
        var rat = f_rat(i, x, P, N);
        i = i - rat;
        if (rat <= rat_tol) {
            break;
        }
    }
    return i;
}

function get_interest(x, N, P) {
    return (x * N) - P;
}


function calculateAll(T,RR,DHAZ,ERHAZ,i,cof,fee_monthly,credit_amt,annuity){
/*var T = 18;
var RR = 0;
var DHAZ = 0.1;
var ERHAZ = 0.000;
var i = 0.02;
var cof = 0.08/12;
var fee_monthly = 0;
var credit_amt = 30000;
var annuity = 2001.06306452373;
*/

const balance_start = [];
const balance_end = [];
const interest = [];
const fee = [];
const fundcost = [];
const cum_interest = [];
const cum_fee = [];
const cum_fundcost = [];
var pd_delta = [];
var cum_pd_delta = [];
var cum_pfin_delta = [];
var pfin_delta = [];
var surv_start = [];
var surv_end = [];


  var interest_income_def = [];
  var fee_income_def = [];
  var loss_def = [];
  var recovery_def = [];
  var lts_def = [];
  var racv_def = [];

  var interest_income_fin = [];
  var fee_income_fin = [];
  var loss_fin = [];
  var recovery_fin = [];
  var lts_fin = [];
  var racv_fin = [];

  var lts_aggregate = 0;
  var racv_aggregate = 0;
  var racv_square_aggregate = 0;

  var res = [];
  var tbl = [];


// populating instalment schedule
for (let t=0; t<T; t++){

  // preparing repayment schedule
  balance_start[t] = t<1 ? credit_amt : balance_end[t-1];
  interest[t] = balance_start[t] * i;
  fundcost[t] = balance_start[t] * cof;
  fee[t] = fee_monthly;
  balance_end[t] = balance_start[t] - (annuity-interest[t]-fee[t]);
  cum_interest[t] = t<1 ? interest[t] : cum_interest[t-1] + interest[t]
  cum_fee[t] = t<1 ? fee[t] : cum_fee[t-1] + fee[t];
  cum_fundcost[t] = t<1 ? fundcost[t] : cum_fundcost[t-1] + fundcost[t];

  // modeling full repayment and default probability per each instalment
  surv_start[t] = Math.pow(1-DHAZ-ERHAZ,t);
  pd_delta[t] = DHAZ*surv_start[t];
  pfin_delta[t] = t<T-1 ? ERHAZ*surv_start[t] : (1-DHAZ)*surv_start[t];
  surv_end[t] = surv_start[t] - pd_delta[t]  - pfin_delta[t] ;
  cum_pd_delta[t] = t<1 ? pd_delta[t] : cum_pd_delta[t-1] + pd_delta[t]  ;
  cum_pfin_delta[t] = t<1 ? pfin_delta[t] : cum_pfin_delta[t-1] + pfin_delta[t]  ;



  // financials for cases exitting the game
  // a. exitting via default
  interest_income_def[t] = cum_interest[t]-interest[t];
  fee_income_def[t] = cum_fee[t]-fee[t];
  loss_def[t] = balance_start[t];
  recovery_def[t] =  loss_def[t] * RR;
  lts_def[t] = (loss_def[t] - recovery_def[t])/credit_amt;
  racv_def[t] = interest_income_def[t] + fee_income_def[t] - loss_def[t] + recovery_def[t] - cum_fundcost[t];

  // b. exitting via full repayment
  interest_income_fin[t] = cum_interest[t];
  fee_income_fin[t] = cum_fee[t];
  loss_fin[t] = 0;
  recovery_fin[t] = 0;
  lts_fin[t] = 0;
  racv_fin[t] = interest_income_fin[t] + fee_income_fin[t] - cum_fundcost[t];

  lts_aggregate += lts_def[t]*pd_delta[t]; 
  racv_aggregate += racv_def[t]*pd_delta[t] + racv_fin[t]*pfin_delta[t];
  racv_square_aggregate += pd_delta[t]*racv_def[t]**2 + pfin_delta[t]*racv_fin[t]**2;

  res.push([racv_def[t], pd_delta[t], 'default on inst. '+(t+1)],
    [racv_fin[t], pfin_delta[t], 'finished on inst. '+(t+1)]);

  tbl.push([t+1,
            balance_start[t].toFixed(2),
            annuity.toFixed(2),
            interest[t].toFixed(2),
            cum_interest[t].toFixed(2),
            fee[t].toFixed(2),
            cum_fee[t].toFixed(2),
            (balance_start[t]-balance_end[t]).toFixed(2),
            balance_end[t].toFixed(2),
            surv_start[t].toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}),
            pd_delta[t].toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}),
            cum_pd_delta[t].toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}),
            pfin_delta[t].toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}),
            cum_pfin_delta[t].toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}),
            surv_end[t].toLocaleString(undefined,{style: 'percent', minimumFractionDigits:2}),
            ]);

};


// sorting array according to racv
res.sort(function(a,b){return a[0] - b[0];});

// filtering array to include non-zero probabilities only
res = res.filter(x => x[1] >0);

// calculating derived metrics


// absolute credit loss
var CLOSS = 0;
for (let t=0; t<T; t++){
  CLOSS += pd_delta[t]*balance_start[t];
};

// absolute credit loss
var REC = 0;
for (let t=0; t<T; t++){
  REC += pd_delta[t]*balance_start[t]*RR;
};


// loss-to-sales (expected value of principal loss)
var LTS = 0;
for (let t=0; t<T; t++){
  LTS += pd_delta[t]*balance_start[t]/credit_amt*(1-RR);
};

// annulized net receivable
var ANR = 0;
for (let t=0; t<T; t++){
  ANR += (1-pd_delta[t]-pfin_delta[t])*balance_start[t]/12;
};

// risk cost to ANR
var RCANR = LTS*credit_amt/ANR;

// interest income
var II = 0;
for (let t=0; t<T; t++){
  II += pd_delta[t]*(cum_interest[t]-interest[t]) + pfin_delta[t]*(cum_interest[t]);
};

// fee income
var FI = 0;
for (let t=0; t<T; t++){
  FI += pd_delta[t]*(cum_fee[t]-fee[t]) + pfin_delta[t]*(cum_fee[t]);
};

// cost of funding
var COF = 0;
for (let t=0; t<T; t++){
  COF += pd_delta[t]*(cum_fundcost[t]) + pfin_delta[t]*(cum_fundcost[t]);
};

// risk-adjusted contributed value
// RACV = interest income + fee income - principal loss - cost of funding + recoveries 
var RACV = II + FI - LTS*credit_amt - COF ;

var results_aggregation = [
  Math.round(II), 
 //* Math.round(FI), */
  Math.round(CLOSS), 
  Math.round(REC), 
  Math.round(COF), 
  Math.round(RACV),
  Math.round(LTS*10000)/100 + "%", 
  Math.round(cum_pd_delta[T-1]*10000)/100 + "%",
  Math.round(RCANR*10000)/100 + "%", 
  Math.round(10000*RACV/credit_amt)/100 + "%",

  ];

  var repeated_inputs = [
    Math.round(credit_amt*100)/100,
    T,
    Math.round(annuity*100)/100 ,
    Math.round(i*100000)/1000 + "%",
    Math.round(DHAZ*10000)/100 + "%",
    Math.round(ERHAZ*10000)/100 + "%",
    Math.round(RR*10000)/100 + "%",
    Math.round(cof*12*10000)/100 + "%"
  ];

var results_to_show = results_aggregation.concat(repeated_inputs);



const table = document.getElementById('loan-table');
const table_columns = table.rows[0].cells.length;
const tbodyRows = table.querySelectorAll('tbody tr');
let valueIndex = 0;

    tbodyRows.forEach(row => {
        // Skip section headers with colspan
        if (row.querySelector('td[colspan]')) return;

        row.cells[table_columns-1].textContent = results_to_show[valueIndex];
        valueIndex++;
    });
    

/*
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: res.map(x=>Math.round(x[0])),
      datasets: [{
        label: 'RACV PMF',
        data: res.map(x=>x[1]),
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          ticks: {
             stepSize: 5000
          },      
        },
        y: {
          beginAtZero: true
        }
      },
      plugins: {
       annotation: {
        annotations: {
          line1: {
            type: 'line',
            scaleID: 'x',
            borderWidth: 2,
            borderColor: 'black',
            value: racv_aggregate,
            display:true,
            label: {
              content: "E(RACV) = " + Math.round(racv_aggregate) +'; STD(RACV) = '+ Math.round(Math.sqrt(racv_square_aggregate-racv_aggregate**2)),
              display: true
            }
          }
          }
       
      }
      }
    }
  })
  */
  



  function makeTable(array) {
    var table = document.getElementById('loan-schedule-table');
    for (var i = 0; i < array.length; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j < array[i].length; j++) {
            var cell = document.createElement('td');
            cell.className = 'numeric';
            cell.textContent = array[i][j];
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    return table;
}

function removeIfExists (selector) {
  var table = document.getElementById('loan-schedule-table')
  var rows = table.querySelectorAll('tbody td');
  if (x) x.remove()
}

/*makeTable(tbl);*/




};


function getLockState(){
  var ann_lock = document.getElementById("annuity-lock").textContent=='🔒' ? "1": "0";
  var term_lock = document.getElementById("term-lock").textContent=='🔒' ? "1" :"0" ;
  var ca_lock = document.getElementById("credit-amount-lock").textContent=='🔒' ? "1" : "0";
  var ir_lock = document.getElementById("ir-lock").textContent=='🔒' ? "1" : "0";
  return ca_lock + term_lock + ann_lock + ir_lock;
};



  function getLoanConfiguration(){
    var ca = document.getElementById("credit-amount-value-box").value *1;
    var term = document.getElementById("term-value-box").value *1;
    var annuity = document.getElementById("annuity-value-box").value*1;
    var ir = document.getElementById("ir-value-box").value*1/100;
    var DHAZ = document.getElementById("dhaz-value-box").value*1/100;
    var ERHAZ = document.getElementById("erhaz-value-box").value*1/100;
    var RR = document.getElementById("rr-value-box").value*1/100;
    var cof = document.getElementById("cof-value-box").value*1/100;

    return [ca, term, annuity, ir, DHAZ, ERHAZ, RR, cof];
  };

  function setLoanConfiguration(arr){

    document.getElementById("credit-amount-slider").value = arr[0];
    document.getElementById("credit-amount-value-box").value = arr[0];

    document.getElementById("term-slider").value = arr[1];
    document.getElementById("term-value-box").value = arr[1];

    document.getElementById("annuity-slider").value = arr[2];
    document.getElementById("annuity-value-box").value = arr[2];

    document.getElementById("ir-slider").value = arr[3]*100;
    document.getElementById("ir-value-box").value = arr[3]*100;

  };


function refresh(){
  arrProduct = getLoanConfiguration();
  calculateAll(arrProduct[1],arrProduct[6],arrProduct[4],arrProduct[5],arrProduct[3],arrProduct[7]/12,0,arrProduct[0],arrProduct[2]);

};

  function ir_changed(new_ir){

   

    old_conf = getLoanConfiguration();
    var lock = getLockState();

    old_ca = old_conf[0];
    old_term= old_conf[1];
    old_annuity = old_conf[2];
    old_ir = old_conf[3];

    var new_term;
    var new_ca;
    var new_ann;


    if (lock == "0000"){


          if (old_term <60){
            new_term = Math.round(old_term + 0.5*(get_term(new_ir,old_annuity, old_ca) - old_term));
            new_term = isNaN(new_term)? old_term : new_term;
            new_ca = old_ca + 0.5*(get_principal(new_ir,old_annuity,new_term) - old_ca);
            new_ca = isNaN(new_ca) ? old_ca : new_ca;
            new_ann = get_annuity(new_ir, new_ca, new_term);
            new_ann = isNaN(new_ann) ? old_annuity : new_ann;
          }
          else {
            new_term = old_term;
            new_ca = old_ca + 0.7*(get_principal(new_ir,old_annuity,new_term) - old_ca);
            new_ann = get_annuity(new_ir, new_ca, new_term);

          }
      
      setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);

} else if (lock == "1000"){
           if (old_term <60){
            new_term = Math.round(old_term + 0.5*(get_term(new_ir,old_annuity, old_ca) - old_term));
            new_term = isNaN(new_term)? old_term : new_term;
            new_ca = old_ca;
            new_ann = get_annuity(new_ir, new_ca, new_term);
            new_ann = isNaN(new_ann) ? old_annuity : new_ann;
          }
          else {
            new_term = old_term;
            new_ca = old_ca;
            new_ann = get_annuity(new_ir, new_ca, new_term);
          };
      setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);
   
 } else if (lock == "0100"){
           
            new_term = old_term;
            new_ca = old_ca + 0.5*(get_principal(new_ir,old_annuity,new_term) - old_ca);
            new_ca = isNaN(new_ca) ? old_ca : new_ca;
            new_ann = get_annuity(new_ir, new_ca, new_term);
            new_ann = isNaN(new_ann) ? old_annuity : new_ann;
          
          ;
      setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);
   
 } else if (lock == "0010"){
           if (old_term <60){
            new_ann = old_annuity;
            new_term = Math.round(old_term + 0.5*(get_term(new_ir,old_annuity, old_ca) - old_term));
            new_term = isNaN(new_term)? old_term : new_term;
            new_ca = old_ca + 0.5*(get_principal(new_ir,old_annuity,new_term) - old_ca);
            new_ca = isNaN(new_ca) ? old_ca : new_ca;
          }
          else {
            new_term = old_term;
            new_ann = old_annuity;
            new_ca = get_principal(new_ir,new_ann,new_term);
          };
      setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);
   
 } else if (lock == "1010"){
            new_term = old_term +(get_term(new_ir,old_annuity, old_ca) - old_term);
            new_term = isNaN(new_term)? old_term : new_term;
            new_ca = old_ca;
            new_ann = old_annuity;
            setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);
  } else if (lock == "1110"){
            new_term = old_term;
            new_ann = old_annuity;
            new_ca = old_ca;
            new_ir = get_interest_rate(new_ann, new_ca, new_term);
            setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);
  } else if (lock == "1100"){
            new_term = old_term;
            new_ca = old_ca;
            new_ann = get_annuity(new_ir,new_ca, new_term);
            setLoanConfiguration([new_ca, new_term, new_ann, new_ir]);
  }
   
 

  refresh();



  };



      

      //relative difference on other parameters when changing interest rate

/*
      d_ca = (get_principal(old_ir+0.00001,old_annuity,old_term)-old_ca)/old_ca;
      d_term = (get_term(old_ir+0.00001,old_annuity, old_ca)-old_term)/old_term;
      d_annuity = (get_annuity(old_ir+0.00001, old_ca, old_term)-old_annuity)/old_annuity;
      d_arr = [d_ca,d_term,d_annuity].map(x=> isNaN(x) ? 0 : x );
      console.log(d_arr);
      d_arr_abs = d_arr.map(x=>Math.abs(x));
      d_max = Math.max(...d_arr_abs);
      weights = d_arr_abs.map(x => x/d_max);
      weights_sum = weights.reduce((a,b)=>a+b);
      weights_final =  weights.map(x => x/weights_sum);
      console.log(weights_final);

      d_ca2 = (get_principal(new_ir,old_annuity,old_term));
      d_term2 = (get_term(new_ir,old_annuity, old_ca));
      d_annuity2 = (get_annuity(new_ir, old_ca, old_term));
      console.log([d_ca2,d_term2,d_annuity2]);

      a=1;
      b=1;


      new_ca_full = get_principal(new_ir,old_annuity,old_term);
      new_ca = old_ca + a*weights_final[0]*(new_ca_full-old_ca);
  
      new_term_full = get_term(new_ir,old_annuity, new_ca);
      new_term = Math.round( old_term + b*weights_final[1]/(weights_final[1]+weights_final[2])*(new_term_full-old_term));
      new_term = isNaN(new_term) ? old_term : new_term;

      new_ann = get_annuity(new_ir, new_ca, new_term);

*/




  

  document.querySelectorAll('.config-row').forEach(row => {
    const slider = row.querySelector('.slider');
    const valueBox = row.querySelector('.value-box');
    const lockBtn = row.querySelector('.lock-btn');

    // Keep slider and input box in sync
    slider.addEventListener('input', () => {
      valueBox.value = slider.value;
    });

    valueBox.addEventListener('input', () => {
      // Optional: Add validation if needed
      slider.value = valueBox.value;
    });

    // Lock/unlock behavior
    lockBtn.addEventListener('click', () => {
      const isLocked = slider.disabled;

      // Toggle disabled state
      slider.disabled = !isLocked;
      valueBox.disabled = !isLocked;

      // Update lock icon
      lockBtn.textContent = isLocked ? '🔓' : '🔒';
    });
  });

  document.getElementById('ir-slider').addEventListener("input",function(e){
    new_ir = e.target.value / 100;
    ir_changed(new_ir);
  });

   document.getElementById('ir-value-box').addEventListener("input",function(e){
    new_ir = e.target.value / 100;
    ir_changed(new_ir);
  });

  document.getElementById('dhaz-value-box').addEventListener("input",function(e){
    refresh();
  });

   document.getElementById('dhaz-slider').addEventListener("input",function(e){
    refresh();
  });

    document.getElementById('erhaz-value-box').addEventListener("input",function(e){
    refresh();
  });

   document.getElementById('erhaz-slider').addEventListener("input",function(e){
    refresh();
  });

    document.getElementById('rr-value-box').addEventListener("input",function(e){
    refresh();
  });

   document.getElementById('rr-slider').addEventListener("input",function(e){
    refresh();
  });

      document.getElementById('cof-value-box').addEventListener("input",function(e){
    refresh();
  });

   document.getElementById('cof-slider').addEventListener("input",function(e){
    refresh();
  });


  function saveResults() {
    const variantName = document.getElementById('variant-name').value.trim();
    if (!variantName) {
        alert('Please enter a variant name.');
        return;
    }

    const table = document.getElementById('loan-table');
    var columnCount = table.rows[0].cells.length;
    var rowCount = table.rows.length;

    for (let rowid=0; rowid<rowCount; rowid++){
      if (table.rows[rowid].querySelector('td[colspan]')){
        table.rows[rowid].cells[0].colSpan = columnCount+1;
      }
      else{
       if (rowid==0){
         let thElement = document.createElement('th');
         let headerRow = table.tHead.rows[0]; 
         let newHeaderCell = headerRow.insertCell(columnCount-1); 
         newHeaderCell.parentElement.replaceChild(thElement, newHeaderCell);
         thElement.textContent =variantName;
       }
       else{
        const newCell = table.rows[rowid].insertCell(columnCount-1);
        newCell.textContent =table.rows[rowid].cells[columnCount].textContent;
       }
      }
    }



   

    // Clear input
    document.getElementById('variant-name').value = '';
}


  refresh();


