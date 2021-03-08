'use strict'
/**
	@file Agrupa las clases necesarias para la aplicación CRUDo.
	@author Miguel Jaque Barbero (mjaque@migueljaque.com).
	@version 0.1
	@license AGPL-3.0-or-later
	<p>Git: {@link https://github.com/mjaque/crudo GitHub}</p>
 	@todo Tratamiento de errores basado en excepciones.
	@todo Incluir el atributo de "objeto" con un select.
	@todo Mejorar el tratamiento de atributos reales (¿2 decimales?).
*/

/**	Representa un tipo genérico con atributos de distintos tipos.
**/
class Clase{
	/**	Constructor de la clase con valores por defecto.
		Los valores por defecto permiten detectar el tipo de cada atributo y evitan valores nulos.
	**/
	constructor(entero = 0, real = 0.0, texto = "", booleano = false, fecha = new Date(), objeto = null){
		this.entero = entero
		this.real = real
		this.texto = texto
		this.booleano = booleano
		this.fecha = fecha
		this.objeto = objeto
	}
	
	/**	Genera un objeto con valores aleatorios
	**/
	static generar(){
		let entero = Math.floor(Math.random() * 100)
		let real = Math.random() * 100
		let texto = Clase.textoAleatorio(10)
		let booleano = (Math.random() > 0.5)
		let fecha = new Date( (new Date()).getTime() + ((Math.random() - 0.5) * 1.6E11) )
		
		return new Clase(entero, real, texto, booleano, fecha, null)
	}
	
	/**	Genera un texto aleatorio.
		@param {integer} longitud - Longitud del texto a generar.
	**/
	static textoAleatorio(longitud) {
		var texto = ''
		var alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		for ( var i = 0; i < longitud; i++ )
      		texto += alfabeto.charAt(Math.floor(Math.random() * alfabeto.length))

		return texto
	}
}

/**	Representa la aplicación CRUDo. Actúa como Controlador (MVC).
	<p>CRUDo es una aplicación CRUD (Create, Read, Update, Delete) genérica. Gestiona objetos de una clase genérica (Clase).</p>
**/
class Crudo{
	/**	Constructor de la clase
		Crea las vistas.
		Crea el modelo de datos.
		Activa el inicio del interfaz al cargar la página.
	**/
	constructor(){
		this.vistaPrincipal = new VistaPrincipal(this)
		this.vistaCrear = new VistaCrear(this)
		this.vistaEditar = new VistaEditar(this)
		this.vistaVer = new VistaVer(this)
		this.modelo = new Modelo()
		window.onload = this.iniciar.bind(this)
	}
	
	/**	Atención al click en "Borrar".
		@param {integer} clave - Identificador del objeto.
	**/
	borrar(clave){
		this.modelo.eliminar(clave)
		this.listar()
	}	

	/**	Atención al click en "Borrar BD".
	**/
	borrarBD(){
		this.modelo.borrarBD()
	}
		
	/**	Llama al modelo para actualizar el objeto.
		@param {Clase} objeto - El objeto modificado. Debe incluir el atributo clave
	**/
	editar(objeto){
		if (!objeto.clave)
			throw ("No es posible actualizar un objeto sin clave válida.")
		this.modelo.actualizar(objeto, this.listar.bind(this))
	}
	
	/**	Atención al click en "Cancelar"
	**/
	cancelar(){
		this.vistaPrincipal.limpiar()
	}

	/**	Atención al click en "Aceptar" del interfaz de Crear
		@param {Clase} objeto - El objeto a crear.
	**/
	crear(objeto){
		this.modelo.insertar(objeto)
		this.listar()
	}
	
	/**	Inicia el interfaz
	**/
	iniciar(){
		this.vistaPrincipal.iniciar()
	}
	
	/**	Atención al click en "Listar"
	**/
	listar(){
		let objetos = this.modelo.listar(this.vistaPrincipal.listar.bind(this.vistaPrincipal))
	}
	
	/**	Atención al click en "Ver"
		Obtiene el objeto de la base de datos y llama a vistaVer.mostrar, pasándole el nodo donde crear el interfaz.
		@param {integer} clave - Identificador del objeto.
	**/
	ver(clave){
		this.modelo.get(clave, this.vistaVer.mostrar.bind(this.vistaVer, this.vistaPrincipal.subvista))
	}
	
	/**	Atención al click en "Crear"
	**/
	verCrear(){
		this.vistaCrear.mostrar(this.vistaPrincipal.subvista)
	}
	
	/**	Atención al click en "Editar"
		Obtiene el objeto de la base de datos y llama a vistaEditar.mostrar, pasándole el nodo donde crear el interfaz.
		@param {integer} clave - Identificador del objeto.
	**/
	verEditar(clave){
		this.modelo.get(clave, this.vistaEditar.mostrar.bind(this.vistaEditar, this.vistaPrincipal.subvista))
	}	
}

/**	Modelo de persistencia de los datos. Basado en IndexedDB.
	<p>Referencia: {@link https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API/Usando_IndexedDB}</p>
	<p>Referencia: {@link https://developer.mozilla.org/es/docs/Web/API/IndexedDB_API}</p>
**/
class Modelo{
	/**	Constructor del Modelo
	**/
	constructor(){
    	//Parámetros
    	this.bdNombre = 'bdCrudo'
    	this.bdVersion = 2
    	
    	//Atributos
		this.bd = null				//La base de datos
		this.os1 = null				//Primer objectStore ("cosas")
		this.nombreOs1 = "cosas"	//Nombre del primer OS
		
		this.conectar()
	}		
	
	/**	Actualiza un objeto en la base de datos
		@param {Clase} objeto - objeto a actualizar.
		@param {Function} accion - Función que se llamará si tiene éxito la consulta y que recibirá el objeto.
	**/
	actualizar(objeto, accion){
		let os = this.getTransaccionOS("readwrite")
		let keyRange = IDBKeyRange.only(Number.parseInt(objeto.clave))	//Definimos el rango de claves, solo con la clave
		//abrimos un cursor para recorrer el resultado. Solo podemos actualizar con un cursor
		os.openCursor(keyRange).onsuccess = function(evento) {
			const cursor = evento.target.result
			if (cursor) {
        		const objetoAntiguo = cursor.value;
        		
        		//Este truco fallará si el objeto tiene atributos nulos. No debe tenerlos
        		Object.entries(objetoAntiguo).forEach( ([atributo, valor]) => {
        			eval(`objetoAntiguo.${atributo} = objeto.${atributo}`)
        		})
				const peticion = cursor.update(objetoAntiguo)
				peticion.onsuccess = accion
      		}
		}
	}

	/**	Actualiza el Modelo a una nueva versión. 
		<p>Si no existe el ObjectStore lo crea.</p>
		@param {Event} evento - Evento del error.
		@returns {boolean} True si la actualización tuvo éxito y se ejecutará onsuccess o false en caso contrario.
	**/
	actualizarBD(evento){
		this.bd = evento.target.result;
		console.log("Actualizando la base de datos...")
		console.log(`Creando el ObjectStore de "${this.nombreOs1}"...`)
		// Crea un almacén de objetos (objectStore) para esta base de datos
		this.os1 = this.bd.createObjectStore(this.nombreOs1, { autoIncrement : true })
		//var objectStore = this.bd.createObjectStore("name", { keyPath: "myKey" });
		
		// Se usa transaction.oncomplete para asegurarse que la creación del almacén
		// haya finalizado antes de añadir los datos en el.
		this.os1.transaction.oncomplete = function(evento) {
			console.log("Creación del ObjectStore de \"cosas\" terminada.")
			console.log("Cargando datos aleatorios...")
			// Guarda los datos en el almacén recién creado.
			//IDBTransaction: https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
			let transaccion = this.bd.transaction(this.nombreOs1, "readwrite")
			let tranOs1 = transaccion.objectStore(this.nombreOs1)	//OS para la transacción

			//Generamos aleatoriamente 20 "cosas"
			for(let i = 0; i < 20; i++)
				tranOs1.add(Clase.generar())
			console.log("Datos aleatorios cargados.")
		}.bind(this)
		console.log("Base de datos actualizada.")
		
		return true;
	}
	
	/**	Borra la base de datos.
	**/
	borrarBD(){
		//Cerramos la conexión (si la hay)
		if (this.bd){
			this.bd.close()
			console.log("Cerrada la conexión a la base de datos")
			this.bd = null
		}
		
		let peticion = window.indexedDB.deleteDatabase(this.bdNombre)
		//peticion.onerror = this.error.bind(this)
		peticion.onsuccess = function(evento){
			console.log("Base de datos borrada.")
			this.conectar()
		}.bind(this)
	}
	
	/**	Abre la conexión con la base de datos.
		<p>La conexión queda en this.bd.</p>
	**/
	conectar(){
		if (!window.indexedDB){
    		window.alert("Su navegador no soporta una versión estable de indexedDB. CRUDo puede no funcionar bien.")
    		return
    	}
    	
    	//Abrimos la base de datos
    	console.log("Abriendo la conexión a la base de datos...")
		var peticion = window.indexedDB.open(this.bdNombre, this.bdVersion)
		peticion.onerror = this.error.bind(this)
		peticion.onsuccess = function(evento){
			this.bd = peticion.result
			this.bd.onerror = this.error.bind(this.bd)
			console.log("Abierta la conexión a la base de datos")
		}.bind(this)
		peticion.onupgradeneeded = this.actualizarBD.bind(this)
	}
	
	/**	Elimina un objeto en la base de datos
		@param {integer} clave - clave del objeto a eliminar.
	**/
	eliminar(clave){
		this.getTransaccionOS("readwrite").delete(clave)
	}
	
	/**	Gestiona los errores del Modelo
		@param {Event} evento - Evento del error.
	**/
	error(evento){
		console.error(evento)	//Ver evento.target.errorCode
		console.error(evento.target.errorCode)
	}
	
	/**	Devuelve un objeto de la base de datos identificado por su clave.
		<p>También añade la clave como atributo del objeto.</p>
		@param {integer} clave - Clave del objeto buscado.
		@param {Function} accion - Función que se llamará si tiene éxito la consulta y que recibirá el objeto.
		@returns {Clase} Objeto de la base de datos.
	**/
	get(clave, accion){
		let tranOS1 = this.getTransaccionOS("readonly")
		let peticion = tranOS1.get(clave)
		peticion.onsuccess = function(evento){
			let objeto = evento.target.result
			objeto.clave = clave
			accion(objeto)
		}
	}
	
	/**	Crea una transacción sobre la base de datos y devuelve un ObjectStore sobre ella.
		@param {string} tipo - Tipo de transacción ("readwrite" o "readonly")
		@returns {ObjectStore} ObjectStore de la transacción creada.
	**/
	getTransaccionOS(tipo){
		let transaccion = this.bd.transaction(this.nombreOs1, tipo)
		let tranOS1 = transaccion.objectStore(this.nombreOs1)	//OS para la transacción
		
		return tranOS1
	}
		
	/**	Inserta un objeto en la base de datos
		@param {Clase} objeto - objeto a insertar.
	**/
	insertar(objeto){
		this.getTransaccionOS("readwrite").add(objeto)
	}
	
	/**	Devuelve la lista de objetos de la base de datos.
		@param {Function} accion - Función que se llamará si tiene éxito la función listar y que recibirá el array de objetos.
	**/
	listar(accion){
		let resultado = []
		
		//Creamos la transacción y obtenemos su OS
		let os = this.getTransaccionOS("readonly")
		os.openCursor().onsuccess = function(evento) {
			let cursor = evento.target.result
			if (cursor) {
				let objeto = cursor.value
				objeto.clave = cursor.primaryKey
				resultado.push(objeto)
				cursor.continue()
 			}
 			accion(resultado)
		}
	}	
}

/**	Representa la generalización de las vistas.
	<p>Incluye métodos de utilidad.</p>
**/
class Vista{
	/**	Constructor de la vista.
		@param {Crudo} controlador - Controlador de la Vista.
	**/
	constructor(controlador){
		this.controlador = controlador
	}
	
	/**	Crea un botón enlazado a una función.
		@param {string} nombre - Texto a mostrar en el boton.
		@param {Function} accion - Función que se llamará al pulsar el boton.
		@param {Crudo|Vista} controlador - Controlador que posee la acción. Si no se especifica se utilizará el controlador.
		@returns {HTMLElement} El elemento "button" creado.
	**/
	crearBoton(nombre, accion, controlador){
		let button = document.createElement("button")
		button.appendChild(document.createTextNode(nombre))
		if (controlador)
			button.onclick = accion.bind(controlador)
		else
			button.onclick = accion.bind(this.controlador)
		
		return button
	}

	/**	Crea un campo de formulario.
		@param {string} tipo - Tipo del campo (text, number, date, hidden...).
		@param {string} id - Identificador del campo.
		@returns {HTMLElement} El elemento "input" creado.
	**/
	crearCampo(tipo, id){
		let input = document.createElement("input")
		input.setAttribute("type", tipo)
		input.id = id
		
		return input
	}
	
	/**	Crea un campo booleano con dos radio buttons.
		@param {string} id - Identificador del campo.
		@returns {HTMLElement} El elemento "input" creado.
	**/
	crearCampoBooleano(id){
		return this.crearCampo("radio", id)
	}
	
	/**	Crea un campo de fecha para un formulario.
		@param {string} id - Identificador del campo.
		@returns {HTMLElement} El elemento "input" creado.
	**/
	crearCampoFecha(id){
		return this.crearCampo("date", id)
	}
	
	/**	Crea un campo numérico para un formulario.
		@param {string} id - Identificador del campo.
		@returns {HTMLElement} El elemento "input" creado.
	**/
	crearCampoNumero(id){
		return this.crearCampo("number", id)
	}
	
	/**	Crea un campo oculto.
		@param {string} id - Identificador del campo.
		@param {Any} valor - Valor para el campo.
		@returns {HTMLElement} El elemento "input" creado.
	**/
	crearCampoOculto(id, valor){
		let input = this.crearCampo("hidden", id)
		input.setAttribute("value", valor)
		
		return input
	}
	
	/**	Crea un campo de texto para un formulario.
		@param {string} id - Identificador del campo de texto.
		@returns {HTMLElement} El elemento "input" creado.
	**/
	crearCampoTexto(id){
		return this.crearCampo("text", id)
	}
	
	/**	Crea un enlace a una función del controlador.
		@param {string} nombre - Texto a mostrar en el enlace.
		@param {Function} accion - Función del controlador que se llamará al pulsar el enlace.
		@param {Any} param - Parámetro para pasar a la acción.
		@returns {HTMLElement} El elemento "a" creado.
	**/
	crearEnlace(nombre, accion, param){
		let a = document.createElement("a")
		a.setAttribute("href", "#")
		a.appendChild(document.createTextNode(nombre))
		a.onclick = accion.bind(this.controlador, param)
		
		return a
	}
	
	/**	Crea un label para un formulario.
		<p>El label llevará el mismo atributo for que la etiqueta.</p>
		@param {string} nombre - Texto a mostrar en el label y el valor de su atributo for.
		@returns {HTMLElement} El elemento "label" creado.
	**/
	crearLabel(nombre){
		let label = document.createElement("label")
		label.setAttribute("for", nombre)
		label.appendChild(document.createTextNode(nombre+": "))
		
		return label
	}

	/**	Elimina los elementos (hijos) de un nodo
		@param {HTMLElement} nodo - El nodo del que se borrarán sus nodos hijos.
	**/
	static vaciar(nodo){
		while(nodo.firstChild)
			nodo.removeChild(nodo.lastChild)
	}

	/** Muestra un objeto con sus atributos y sus valores.
		@param {Clase} objeto - El objeto a mostrar
		@returns {HTMLElement} Un span con los atributos y valores del objeto.
	**/
	ver(objeto){
		let span = document.createElement("span")
		
		//Iteramos sobre los atributos del objeto
		Object.entries(objeto).forEach( ([atributo, valor]) => {
    		//if (Object.prototype.hasOwnProperty.call(objeto, atributo))
				
			//Si es fecha
			if (valor instanceof Date)
				valor = valor.getDate()+"/"+(valor.getMonth()+1)+"/"+valor.getFullYear()
				
			//Si es real
			if (typeof valor === 'number' && Math.floor(valor) !== valor)
				valor = Math.floor(valor * 100) / 100
					
			span.appendChild(document.createTextNode(atributo + ":" + valor+" "))
		})
		
		return span
	}
}

/**	Representa la vista para crear objetos.
**/
class VistaCrear extends Vista{
	/**	Constructor de la vista.
		@param {Crudo} controlador - Controlador de la Vista.
	**/
	constructor(controlador){
		super(controlador)
		this.raiz = null		//Nodo en el que se creará el interfaz
	}
	
	/**	Lee los datos del interfaz de Crear y llama al controlador
	**/
	crear(){
		let objeto = new Clase()	
		Object.entries(objeto).forEach( ([atributo, valor]) => {
			if (typeof valor === "string")
				eval(`objeto.${atributo} = "${document.getElementById(atributo).value}"`)		
			else if (valor instanceof Date)
				eval(`objeto.${atributo} = new Date("${document.getElementById(atributo).value}")`)
			else if (typeof valor === "boolean")
				eval(`objeto.${atributo} = ${document.querySelector(`input[name=${atributo}]:checked`).value}`)
			else if (!document.getElementById(atributo))
				eval(`objeto.${atributo} = null`)
			else
				eval(`objeto.${atributo} = ${document.getElementById(atributo).value}`)
		})
		this.controlador.crear(objeto)
	}

	/**	Muestra el interfaz para crear un nuevo objeto.
		@param {HTMLElement} raiz - Nodo en el que se mostrará el interfaz.
	**/
	mostrar(raiz){
		this.raiz = raiz
		Vista.vaciar(raiz)

		let objeto = new Clase()	
		Object.entries(objeto).forEach( ([atributo, valor]) => {

			this.raiz.appendChild(super.crearLabel(atributo))		
			if (typeof valor === 'string')
				this.raiz.appendChild(super.crearCampoTexto(atributo))
			else if (typeof valor === 'number')
				this.raiz.appendChild(super.crearCampoNumero(atributo))
			else if (valor instanceof Date)
				this.raiz.appendChild(super.crearCampoFecha(atributo))
			else if (typeof valor === 'boolean'){
				let inputV = super.crearCampoBooleano(atributo)
				inputV.name = atributo
				inputV.id = "Verdadero"
				inputV.value = true
				this.raiz.appendChild(super.crearLabel(inputV.id))
				this.raiz.appendChild(inputV)
				let inputF = super.crearCampoBooleano(atributo)
				inputF.name = atributo
				inputF.id = "Falso"
				inputF.value = false
				this.raiz.appendChild(super.crearLabel(inputF.id))
				this.raiz.appendChild(inputF)
			}
			this.raiz.appendChild(document.createElement("br"))
		})
		
		this.raiz.appendChild(super.crearBoton("Cancelar", this.controlador.cancelar))
		this.raiz.appendChild(document.createTextNode(" "))
		this.raiz.appendChild(super.crearBoton("Aceptar", this.crear, this))		
	}	
}

/**	Representa la vista para editar objetos.
**/
class VistaEditar extends Vista{
	/**	Constructor de la vista.
		@param {Crudo} controlador - Controlador de la Vista.
	**/
	constructor(controlador){
		super(controlador)
		this.raiz = null		//Nodo en el que se creará el interfaz
	}
	
	/**	Lee los datos del interfaz de Editar y llama al controlador
	**/
	editar(){
		let objeto = new Clase()
		Object.entries(objeto).forEach( ([atributo, valor]) => {
			if (typeof valor === "string")
				eval(`objeto.${atributo} = "${document.getElementById(atributo).value}"`)		
			else if (valor instanceof Date)
				eval(`objeto.${atributo} = new Date("${document.getElementById(atributo).value}")`)
			else if (typeof valor === "boolean")
				eval(`objeto.${atributo} = ${document.querySelector(`input[name=${atributo}]:checked`).value}`)
			else if (!document.getElementById(atributo))
				eval(`objeto.${atributo} = null`)
			else
				eval(`objeto.${atributo} = ${document.getElementById(atributo).value}`)
		})
		objeto.clave = document.getElementById('clave').value
		this.controlador.editar(objeto)
	}	

	/**	Muestra el interfaz para editar un objeto.
		@param {HTMLElement} raiz - Nodo en el que se mostrará el interfaz.
		@param {Clase} objeto - Objeto a editar.
	**/
	mostrar(raiz, objeto){
		this.raiz = raiz
		Vista.vaciar(raiz)

		Object.entries(objeto).forEach( ([atributo, valor]) => {
			if (atributo === "clave"){
				this.raiz.appendChild(super.crearCampoOculto(atributo, valor))
				return	//continue
			}
			this.raiz.appendChild(super.crearLabel(atributo))	
			if (typeof valor === 'string'){
				let campo = super.crearCampoTexto(atributo)
				this.raiz.appendChild(campo)
				campo.value = valor
			}
			else if (typeof valor === 'number'){
				let campo = super.crearCampoNumero(atributo)
				this.raiz.appendChild(campo)
				campo.value = valor
			}
			else if (valor instanceof Date){
				let campo = super.crearCampoFecha(atributo)
				this.raiz.appendChild(campo)
				campo.value = valor.toISOString().slice(0,10)
			}
			else if (typeof valor === 'boolean'){
				let inputV = super.crearCampoBooleano(atributo)
				inputV.name = atributo
				inputV.id = "Verdadero"
				inputV.value = true
				this.raiz.appendChild(super.crearLabel(inputV.id))
				this.raiz.appendChild(inputV)
				let inputF = super.crearCampoBooleano(atributo)
				inputF.name = atributo
				inputF.id = "Falso"
				inputF.value = false
				this.raiz.appendChild(super.crearLabel(inputF.id))
				this.raiz.appendChild(inputF)
				if (valor)
					inputV.setAttribute("checked", true)
				else
					inputF.setAttribute("checked", true)
			}
			this.raiz.appendChild(document.createElement("br"))
		})
		
		this.raiz.appendChild(super.crearBoton("Cancelar", this.controlador.cancelar))
		this.raiz.appendChild(document.createTextNode(" "))
		this.raiz.appendChild(super.crearBoton("Aceptar", this.editar, this))		
	}
}

/**	Vista Principal de la aplicación.
	@extends Vista
**/
class VistaPrincipal extends Vista{
	/**	Constructor de la vista.
		@param {Crudo} controlador - Controlador de la Vista.
	**/
	constructor(controlador){
		super(controlador)
		this.subvista = null	//Nodo para alojar subvistas
	}
	
	/**	Carga los elementos HTML de la vista
	**/
	iniciar(){
		this.header = document.getElementsByTagName('header')[0]
		this.nav = document.getElementsByTagName('nav')[0]
		this.main = document.getElementsByTagName('main')[0]
		this.footer = document.getElementsByTagName('footer')[0]
		
		this.mostrar(this.main)
	}
	
	/**	Vacía la subvista
	**/
	limpiar(){
		Vista.vaciar(this.subvista)
	}

	/**	Muestra la lista de objetos.
		@param {Array.<Clase>} objetos - Array de objetos a mostrar.
	**/
	listar(objetos){
		this.limpiar()
		objetos.forEach(objeto => {
			this.subvista.appendChild(this.ver(objeto))

			//Botones para Ver, editar y borrar
			this.subvista.appendChild(super.crearEnlace("Ver", this.controlador.ver, objeto.clave))
			this.subvista.appendChild(document.createTextNode(" "))
			this.subvista.appendChild(super.crearEnlace("Editar", this.controlador.verEditar, objeto.clave))
			this.subvista.appendChild(document.createTextNode(" "))
			this.subvista.appendChild(super.crearEnlace("Borrar", this.controlador.borrar, objeto.clave))
						
			this.subvista.appendChild(document.createElement("br"))
		})
	}
	
	/**	Crea el interfaz HTML de la vista.
	**/
	mostrar(){
		Vista.vaciar(this.header)		
		let h1 = document.createElement('h1')
		h1.appendChild(document.createTextNode('Gestor de Objetos'))
		this.header.appendChild(h1)

		Vista.vaciar(this.nav)
		this.nav.appendChild(super.crearEnlace("Crear Objeto", this.controlador.verCrear))
		this.nav.appendChild(document.createTextNode(" "))
		this.nav.appendChild(super.crearEnlace("Listar Objetos", this.controlador.listar))
		this.nav.appendChild(document.createTextNode(" "))
		this.nav.appendChild(super.crearEnlace("Borrar BD", this.controlador.borrarBD))
		
		Vista.vaciar(this.main)		
		this.subvista = document.createElement("div")
		this.main.appendChild(this.subvista)
	}
}

/**	Representa la vista para ver objetos.
**/
class VistaVer extends Vista{
	/**	Constructor de la vista.
		@param {Crudo} controlador - Controlador de la Vista.
	**/
	constructor(controlador){
		super(controlador)
		this.raiz = null		//Nodo en el que se creará el interfaz
	}
	
	/**	Muestra el interfaz para mostrar los detalles de un objeto.
		@param {HTMLElement} raiz - Nodo en el que se mostrará el interfaz.
		@param {Clase} objeto - Objeto a editar.
	**/
	mostrar(raiz, objeto){
		this.raiz = raiz
		Vista.vaciar(raiz)
		this.raiz.appendChild(this.ver(objeto))
		this.raiz.appendChild(document.createElement("br"))
		this.raiz.appendChild(super.crearBoton("Volver", this.controlador.cancelar))
	}	
}

