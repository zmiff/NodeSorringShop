$(document).ready(function(){


  //Hide show timepicker
  $("#inputStateTid").change(function(){
      if($("#inputStateTid").val() === "vælg selv tid"){
        $('#timePicker').slideDown();
      }
      else if($("#inputStateTid").val() === "hurtigst muligt"){
        $('#timePicker').slideUp();
      }
  });
  //end hide show timepicker

  //change bestil/betal knappe
  $('#btnSend').hide();
  $('.stripe-button-el').hide();
  $("#inputStateBetaling").change(function(){
    if($("#inputStateBetaling").val() === "Online med kort"){
      $('.stripe-button-el').prop("disabled",false);
      $('.stripe-button-el').show();
      $('#btnSend').hide();
    }
    else if($("#inputStateBetaling").val() === "Ved levering/afhentning (kontant eller mobilepay)"){
      $('#btnSend').show();
      $('.stripe-button-el').hide();
      $('.stripe-button-el').prop("disabled",true);
    }
    else{
      $('#btnSend').hide();
      $('#customButton').hide();
    }
  });//end change bestil/betal knappe

  $('#btnSend').on('click', function(){
    $('#checkout-form').submit()
    $('#btnSend').prop("disabled",true);
  });

//date- & timepicker & order time stuff
if(deliveryTime){
  let d = new Date();
  let dDel = new Date(Date.now()+deliveryTime); //delTime & pickTime from bestilling.hbs script
  let dPick = new Date(Date.now()+pickupTime);  //delTime & pickTime from bestilling.hbs script
  let minsDel = dDel.getMinutes();
  let hoursDel = dDel.getHours();
  let minsPick = dPick.getMinutes();
  let hoursPick = dPick.getHours();
  var day = d.getDate();
  let weekDay = '';
  switch (d.getDay()) {
    case 0:
        weekDay = "Søndag";
        break;
    case 1:
        weekDay = "Mandag";
        break;
    case 2:
        weekDay = "Tirsdag";
        break;
    case 3:
        weekDay = "Onsdag";
        break;
    case 4:
        weekDay = "Torsdag";
        break;
    case 5:
        weekDay = "Fredag";
        break;
    case 6:
        weekDay = "Lørdag";
    }//end switch
  //for timepicker
  let month = d.getMonth()+1;
  var year = d.getFullYear();
  var H = d.getHours();
  var m = d.getMinutes();
  var HH = dDel.getHours();
  var mm = dDel.getMinutes();
  var delTime = HH+':'+mm;
  var startTime = 16+':'+00;
  var maxTime = 21+':'+00;
  if(delTime>startTime){
      startTime = delTime;
  }
  if(delTime>21+':'+00){
    $('#inputStateTidspunkt').val('Butikken har desværre lukket for selvvalgt tid for idag.');
    $('#inputStateTidspunkt').prop('disabled', 'disabled');
    }

  $('#inputStateTidspunkt').timepicker({
    minTime: startTime,
    maxTime: '21:00',
    interval: 15,
    timeFormat: 'HH:mm'
  });
    /* ikke i brug.
  $('#inputStateDato').val(d);
  $( "#inputStateDato" ).datepicker({
    minDate: 0,
    maxDate: 30
  });
  */
  //end date- & timepicker

}//end if deltime != undefined

});//end document ready
