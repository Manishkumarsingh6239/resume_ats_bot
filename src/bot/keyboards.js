const actionKeyboard = {
  reply_markup: {
    inline_keyboard: [[
      { text: '✏️ Edit resume', callback_data: 'edit' },
      { text: '📄 Download PDF', callback_data: 'dl_pdf' },
      { text: '📝 Download DOCX', callback_data: 'dl_docx' },
    ]],
  },
};

export { actionKeyboard };