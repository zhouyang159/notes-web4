import React, { useState } from "react";
import axios from "axios";
import { message, Modal, Form, Input } from "antd";


const SetNotePwModal = ({ isModalOpen = false, closeModal = () => { }, onSetPasswordSuccess = () => { } }) => {
   const [password1, setPassword1] = useState("");
   const [password2, setPassword2] = useState("");


   return <Modal
      title="Set note password"
      open={isModalOpen}
      onOk={() => {
         if (password1 !== password2) {
            message.warn("please check password");
            return;
         }

         axios
            .post(`/user/setNotePassword/${password1}`)
            .then((res) => {
               onSetPasswordSuccess();
            });

      }}
      onCancel={() => {
         closeModal();
      }}
   >
      <Form
         name="basic"
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 16 }}
      >
         <Form.Item
            label="note password"
            rules={[{ required: true, message: 'Please input your username!' }]}
         >
            <Input value={password1} onChange={(e) => setPassword1(e.target.value)} />
         </Form.Item>
         <Form.Item
            label="type again"
            rules={[{ required: true, message: 'Please input your password!' }]}
         >
            <Input value={password2} onChange={(e) => setPassword2(e.target.value)} />
         </Form.Item>
      </Form>
   </Modal>
}

export default SetNotePwModal;
