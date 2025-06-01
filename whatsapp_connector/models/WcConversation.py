# -*- coding: utf-8 -*-

from odoo import models, api
from odoo.addons.whatsapp_connector.tools import get_binary_attach


class Conversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    @api.onchange('res_partner_id')
    def onchange_res_partner_id(self):
        convs = self.filtered(lambda conv: conv.connector_id.is_wechat())
        super(Conversation, self - convs).onchange_res_partner_id()

    def update_conversation(self):
        if self.connector_id.is_wechat():
            if not self.env.context.get('not_download_profile_picture'):
                params = {'chatId': self.number}
                self._update_conversation(params, timeout=None)
        else:
            super(Conversation, self).update_conversation()

    @api.model
    def search_partner_from_number(self, conv_id):
        out = self.env['res.partner']
        if not conv_id.connector_id.is_wechat():
            out = super(Conversation, self).search_partner_from_number(conv_id)
        return out

    def split_complex_message(self, msg_data):
        msg_data = super(Conversation, self).split_complex_message(msg_data)
        if self.connector_id.is_wechat() and msg_data['ttype'] in ('product', 'image', 'video', 'file', 'audio'):

            def create_text_message(msg_origin, caption):
                msg_2nd = msg_origin.copy()
                msg_2nd.update({'ttype': 'text', 'text': caption, 'res_model': False, 'res_id': False})
                msg_origin['text'] = ''  # quitar el caption al mensaje original
                return msg_2nd

            msg_2nd = None
            caption = msg_data.get('text', '')
            # se crea otro mensaje de tipo texto con el caption
            if msg_data['ttype'] in ('file', 'audio', 'image', 'video'):
                if caption:
                    msg_2nd = create_text_message(msg_data, caption)
                msg_data['text'] = ''
            elif msg_data['ttype'] == 'product':
                prod_id, caption = self.get_product_caption(msg_data.get('res_id'), caption)
                attach = get_binary_attach(self.env, 'product.product', prod_id.id,
                                           'image_chat', fields_ret=['id'])
                if caption and attach:  # se tiene que crear un mensaje nuevo
                    msg_2nd = create_text_message(msg_data, caption)  # nuevo mensaje
                    msg_data['show_product_text'] = False
            if msg_2nd:  # enviar y notificar el mensaje
                message_obj = self.env['acrux.chat.message'].create(msg_2nd)
                message_obj.message_send()
                data_to_send = self.build_dict(limit=0)
                data_to_send[0]['messages'] = message_obj.get_js_dict()
                self._sendone(self.get_bus_channel(), 'new_messages', data_to_send)
        return msg_data
