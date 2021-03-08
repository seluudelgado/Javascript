function descargaArchivo(){
    var titulopelicula =prompt("Introducir peli");
    $.ajax({
        url:   'http://www.omdbapi.com/?i=tt3896198&apikey=f02e43b0&t='+titulopelicula,
        datatype: 'json',
        type:  'GET',
        async: 'true',
        success:  function (datos) {
            visualizarPelicula(datos);
        }
    });
}
function visualizarPelicula(datos) {
    document.getElementById("titulo").value=datos.Title;
    document.getElementById("anyo").value=datos.Year;
    document.getElementById("duracion").value=datos.Runtime;
    document.getElementById("pais").value=datos.Country;
    document.getElementById("imdb").value=datos.imdbID;
    document.getElementById("sinop").value=datos.Plot;
    document.getElementById("director").value=datos.Director;
    document.getElementById("productor").value=datos.Production;
    document.getElementById("fecha").value=datos.Released;
    document.getElementById("guion").value=datos.Writer;
    document.getElementById("genero").value=datos.Genre;
    document.getElementById("portada").style.backgroundImage="url("+datos.Poster+")";

}
function guardarPelicula(datos)
{
    var imdb=document.getElementById("imdb")[0].value;
    var titulo=document.getElementById("titulo")[0].value;
    var anyo=document.getElementById("anyo")[0].value;
    var duracion=document.getElementById("duracion")[0].value;
    var pais=document.getElementById("pais")[0].value;
    var sinop=document.getElementById("sinop")[0].value;
    var director=document.getElementById("director")[0].value;
    var productor=document.getElementById("productor")[0].value;
    var fecha=document.getElementById("fecha")[0].value;
    var guion=document.getElementById("guion")[0].value;
    var genero=document.getElementById("genero")[0].value;
    var portada=document.getElementById("portada")[0].value;

    var date = new Date(fechaL)
    var fecha=date.toISOString()
    $.ajax({
        url:   'consulta.php',
        datatype: 'php',
        type:  'post',
        data: '&imdb='+imdb+'&titulo='+titulo+'&anyo='+anyo+'&duracion='+duracion+'&pais='+pais+'&sinop='+sinop+'&director='+director+'&productor='+productor+'&fecha='+fecha+'&guion='+guion+'&genero='+genero+'&portada='+portada+'.jpg',
        success:  function (datos) {
            if(datos=="correcto")
            {
                alert("Bien guardado");
                guardarImagen(titulo);
            }else{
                alert(datos);
            }
        }
    });
}