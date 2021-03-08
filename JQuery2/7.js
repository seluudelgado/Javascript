$(function() {
    $("button:first").click(function(){
        $("div").addClass("rojo");
    });
    $("button:last").click(function(){
        $("div").removeClass("rojo");
    });
});