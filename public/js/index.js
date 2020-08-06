let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
let date = new Date().toLocaleDateString('es-MX', options);
date = date[0].toUpperCase() + date.substring(1);
$("#currentDate").text(date);