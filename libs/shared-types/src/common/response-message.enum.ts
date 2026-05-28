export enum ResponseMessage {
  MSG_1 = 'This field is mandatory. You must provide information in this field to proceed.',
  MSG_2 = 'Your username or password might be wrong. Please check and try again later.',
  MSG_3 = 'Sign in successful.',
  MSG_4 = 'Your information is not in the correct format. Please check again.',
  MSG_5 = 'Your entered email had been existed in the system. Please check again.',
  MSG_6 = 'Your entered phone number had been existed in the system. Please check again.',
  MSG_7 = 'Save data successful.',
  MSG_8 = 'The size of image is too large. You need to compress it to upload.',
  MSG_9 = 'Your action is failed due to constraints in the system.',
  MSG_10 = 'This username had been existed in the system. Please choose another username.',
  MSG_11 = 'Are you sure you want to delete this [item]?',
}

export enum ResponseMessageButton {
  OK = 'Ok',
  YES_NO = 'Yes/No',
}

export const RESPONSE_MESSAGE_BUTTONS: Record<
  ResponseMessage,
  ResponseMessageButton
> = {
  [ResponseMessage.MSG_1]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_2]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_3]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_4]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_5]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_6]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_7]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_8]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_9]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_10]: ResponseMessageButton.OK,
  [ResponseMessage.MSG_11]: ResponseMessageButton.YES_NO,
};
