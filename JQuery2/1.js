$(function()
{
    $("h1:first").click(function () {
        $("h1:first").css({background: 'red'})
        $("h1:first").css({color: 'yellow'})
        $("h1:first").css({fontFamily:"Comic Sans MS"})
    });
    $("h1:last").click(function ()
    {
        $("h1:last").css({background: 'yellow'})
        $("h1:last").css({color: 'red'})
        $("h1:last").css({fontFamily:"Comic Sans MS"})
    });
});