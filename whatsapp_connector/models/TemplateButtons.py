# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class WhatsappButtonsBase(models.AbstractModel):
    _name = 'acrux.chat.button.base'
    _rec_name = 'btn_id'
    _description = 'Chat Button Base'

    btn_id = fields.Char('Id', required=True)
    ttype = fields.Selection([('replay', 'Quick Reply'),
                              ('url', 'URL'),
                              ('call', 'Call')],
                             string='Type', required=True, default='replay')
    text = fields.Char('Text', required=True)
    url = fields.Char('URL')
    phone = fields.Char('Phone')

    @api.onchange('ttype')
    def _onchange_type(self):
        for btn in self:
            if btn.ttype == 'replay':
                btn.url = False
                btn.phone = False
            elif btn.ttype == 'url':
                btn.phone = False
            elif btn.ttype == 'call':
                btn.url = False

    @api.constrains('text')
    def _constrains_text_length(self):
        for btn in self:
            if btn.text and len(btn.text) > 20:
                raise ValidationError(_('Text can be till 20 characters.'))


class TemplateButtons(models.Model):
    _inherit = 'acrux.chat.button.base'
    _name = 'acrux.chat.template.button'
    _description = 'Chat Template Button'

    template_id = fields.Many2one('mail.template', string='Template',
                                  required=True, ondelete='cascade')

    def get_to_create(self):
        return [(0, 0, {
            'btn_id': rec.btn_id,
            'ttype': rec.ttype,
            'text': rec.text,
            'url': rec.url,
            'phone': rec.phone,
        }) for rec in self]


class MessageButtons(models.Model):
    _inherit = 'acrux.chat.button.base'
    _name = 'acrux.chat.message.button'
    _description = 'Chat Message Button'

    message_id = fields.Many2one('acrux.chat.message', string='Message',
                                 required=True, ondelete='cascade')


class DefaultMessageButtons(models.Model):
    _inherit = 'acrux.chat.button.base'
    _name = 'acrux.chat.default.message.button'
    _description = 'Chat Default Message Button'

    message_id = fields.Many2one('acrux.chat.default.answer', string='Message',
                                 required=True, ondelete='cascade')


class ListItemButtons(models.Model):
    _inherit = 'acrux.chat.button.base'
    _name = 'acrux.chat.message.list.item.button'
    _description = 'Chat List Item Button'

    description = fields.Char('Description', size=72)
    item_id = fields.Many2one('acrux.chat.message.list.item', string='List Item',
                              required=True, ondelete='cascade')
