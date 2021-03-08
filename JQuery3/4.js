$(function()
{
    $("button").click(function ()
    {
        $("#sinparametros").fadeToggle()
        $("#lento").fadeToggle("slow")
        $("#3segundos").fadeToggle(3000)
    });
});