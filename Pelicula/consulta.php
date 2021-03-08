<?php
		//Configuracion de la conexion a base de datos
	$bd_host = "localhost"; 
	$bd_usuario = "root"; 
	$bd_password = ""; 
	$bd_base = "catalogo";

	$mysqli = mysqli_connect($host, $usuario_db, $clave,$basededatos);
    $sinopsis=mysqli_real_escape_string($mysqli, $_POST["sinopsis"]);
    $consulta = "INSERT INTO pelicula (imdb,titulo,anyo,duracion,pais,director,productor,guion,genero,portada,sinopsis,fecha) VALUES ('".$__POST['imdb']."','".$__POST['titulo']."','".$__POST['anyo']."','".$__POST['duracion']."','".$__POST['pais']."','".$__POST['sinop']."','".$__POST['director']."','".$__POST['productor']."','".$__POST['guion']."','".$__POST['genero']."','".$__POST['portada']."','".$__POST['fecha']."')";
    if($sql = mysqli_query($mysqli,$consulta))
        echo 'bien';
    else
        echo mysqli_error($mysqli);
?>
