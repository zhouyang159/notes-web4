import React, { useState } from "react";
import axios from "axios";
import { message, Modal, Form, Input, Button } from "antd";

const ChangeNotePwModal = ({ isModalOpen = false, closeModal = () => { }, onSuccess = () => { } }) => {
   const [oldPassword, setOldPassword] = useState("");
   const [password1, setPassword1] = useState("");
   const [password2, setPassword2] = useState("");

   return <Modal
      title="Set note password"
      open={isModalOpen}
      maskClosable={false}
      footer={<div>
         <Button onClick={closeModal}>Cancel</Button>
         <Button type="primary" onClick={() => {
            if (oldPassword === "") {
               message.warn("please check");
               return;
            }
            if (password1 !== password2) {
               message.warn("please check");
               return;
            }
            if (password1 === "" || password2 === "") {
               // cancel note password
               new Promise((resolve, reject) => {
                  axios
                     .post(`/user/validateNotePassword/${oldPassword}`)
                     .then((res) => {
                        resolve();
                     })
               })
                  .then(() => {
                     axios
                        .post(`/user/setNotePassword/null`) // set password to null to cancel password
                        .then((res) => {
                           message.success("cancel note password");
                           onSuccess();
                        });
                  })
            } else {
               // change password
               new Promise((resolve, reject) => {
                  axios
                     .post(`/user/validateNotePassword/${oldPassword}`)
                     .then((res) => {
                        resolve();
                     })
               })
                  .then(() => {
                     axios
                        .post(`/user/setNotePassword/${password1}`)
                        .then((res) => {
                           message.success("change note password success");
                           onSuccess();
                        });
                  })
            }

         }}>Change Password</Button>
      </div>}
   >
      <Form
         name="basic"
         labelCol={{ span: 8 }}
         wrapperCol={{ span: 16 }}
      >
         <Form.Item
            label="old password"
         >
            <Input value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
         </Form.Item>

         <Form.Item
            label="new password"
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

export default ChangeNotePwModal;
