import React, { useState } from "react";
import axios from "axios";
import { message, Modal, Form, Input } from "antd";


const SetNotePwModal = ({ isModalOpen = false, closeModal = () => { }, onSuccess = () => { } }) => {
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
         if (password1 === "" || password2 === "") {
            message.warn("please check password");
            return;
         }

         axios
            .post(`/user/setNotePassword/${password1}`)
            .then((res) => {
               onSuccess();
            });
      }}
      onCancel={() => {
         closeModal();
      }}
      maskClosable={false}
   >
      <Form
         name="basic"
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 16 }}
      >
         <Form.Item
            label="note password"
         >
            <Input value={password1} onChange={(e) => setPassword1(e.target.value)} />
         </Form.Item>
         <Form.Item
            label="check"
         >
            <Input value={password2} onChange={(e) => setPassword2(e.target.value)} />
         </Form.Item>
      </Form>
   </Modal>
}

export default SetNotePwModal;
