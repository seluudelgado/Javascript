$(function() {
    $("#primero").click(function () {
        $("table").css({border: '1px solid black'})
    });
    $("#segundo").click(function () {
        alert("Tiene un border ")+$("table").attr("border");
    });
    $("#segundo").click(function () {
        $("table").css({border: '0px solid black'})
    });
});
