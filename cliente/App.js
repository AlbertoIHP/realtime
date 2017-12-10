import React from 'react';
import { View, Text, AsyncStorage } from 'react-native';
import SocketIOClient from 'socket.io-client';
import { GiftedChat } from 'react-native-gifted-chat';
const USER_ID = '@userId';

export default class App extends React.Component {

  constructor(props) 
  {
    //Tomamos todas las props que nos sean entregadas 
    super(props);

    //Inicializamos nuestros states, en est ecaso los mensajes
    //y el id del usuario
    this.state = {
      messages: [],
      userId: null
    };

   
    this.determineUser = this.determineUser.bind(this);
    this.onReceivedMessage = this.onReceivedMessage.bind(this);
    this.onSend = this.onSend.bind(this);
    this._storeMessages = this._storeMessages.bind(this);


    //Nos conectamos al servidor en NODEJS+MongoDB
    this.socket = SocketIOClient('http://192.168.1.5:3000');
    console.log(this.socket)

    //Escuchamos el evento, y cargamos la funcion
    this.socket.on('message', this.onReceivedMessage);

    //Determi namos el usuario
    this.determineUser();
  }



   //Verificamos si el usuario que entro ya tiene id, sino, se le pregunta el servidor
  determineUser() 
  {

    console.log("Determinando usuario")
    AsyncStorage.getItem(USER_ID)
      .then((userId) => {
        // si no tiene una id, entonces avisaremos al servidor para que nos entregue una
        // y guardarlo en nuestro state
        if (!userId) 
        {

          console.log("No se ha encontrado el usuario, emitiendo evento mediante socket")
          this.socket.emit('userJoined', null);

          //Quedamos escuchando si entrara otro usuario y el servidor nos avisara
          console.log("Escuchando por si entra otra persona al chat")
          this.socket.on('userJoined', (userId) => {
            AsyncStorage.setItem(USER_ID, userId);
            this.setState({ userId });
          });


        } 
        else 
        {

          //Si ya tiene una, entonces entregamos directamente al servidor la ID del usuario
          // y de igual manera lo dejamos en el state

          console.log("La id del usuario si esta, avisandole al servidor")
          this.socket.emit('userJoined', userId);

          console.log("Guardando el ID del usuario en el STATE")
          this.setState({ userId });
        }
      })
      .catch((e) => alert(e));
  }





















  //Cuando se reciben mensajes
  onReceivedMessage(messages) 
  {
    this._storeMessages(messages);
  }


  //Esta funcion, recibe el mensaje para concatenarlo al state
  _storeMessages(messages) 
  {
    this.setState((previousState) => {
      return {
        messages: GiftedChat.append(previousState.messages, messages),
      };
    });
  }




















  //Metodo de renderizado de vista
  render() 
  {
    var user = { _id: this.state.userId || -1 };

    return (
      <GiftedChat
        messages={this.state.messages}
        onSend={this.onSend}
        user={user}
      />
    );
  }


    //Cuando se envie un mensaje, se avisara al servidor mediante el evento, pero tamvbien se guardara en el state

    onSend(messages=[]) 
    {
      console.log("Emitiendo el evento mediante el socket al servidor")
      console.log(messages[0])
      this.socket.emit('message', messages[0]);
      this._storeMessages(messages);
    }

}


