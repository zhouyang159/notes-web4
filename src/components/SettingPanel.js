import React, { useState } from "react";
import axios from "axios";
import { message, Modal, Form, Input } from "antd";


const SettingPanel = ({ isModalOpen = false, closeModal = () => { } }) => {

   return <Modal
      title="Settings"
      open={isModalOpen}
      onOk={() => {

      }}
      onCancel={closeModal}
      maskClosable={false}
      footer={null}
   >
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
      <div></div>SettingPanel
   </Modal>
}

export default SettingPanel;
