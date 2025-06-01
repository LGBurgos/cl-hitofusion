# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class WhatsappMessageList(models.Model):
    _name = 'acrux.chat.message.list'
    _description = 'Chat Message List'

    name = fields.Char('Name', required=True, size=60,
                       help='Title for list')
    button_text = fields.Char('Button Title', required=True, size=20,
                              help='Text for principal button of list')
    items_ids = fields.One2many('acrux.chat.message.list.item', 'list_id',
                                string='Sections', required=True)
    message_ids = fields.One2many('acrux.chat.message', 'chat_list_id',
                                  string='Message', copy=False)
    default_answer_ids = fields.One2many('acrux.chat.default.answer', 'chat_list_id',
                                         string='Default Answers', copy=False)
    mail_template_ids = fields.One2many('mail.template', 'chat_list_id',
                                        string='Template', copy=False)
    active = fields.Boolean('Active', default=True)

    def copy(self, default=None):
        default = default or {}
        chat_list = super(WhatsappMessageList, self).copy(default)
        for item_id in self.items_ids:
            item_id.copy(default={'list_id': chat_list.id})
        return chat_list

    def is_empty(self):
        return not self.default_answer_ids and not self.mail_template_ids

    @api.constrains('message_ids')
    def _constrains_message_ids(self):
        for chat_list in self:
            if chat_list.message_ids:
                if len(chat_list.message_ids.ids) > 1:
                    raise ValidationError(_('For List, only one message is allowed.'))
                if chat_list.default_answer_ids or chat_list.mail_template_ids:
                    raise ValidationError(_('List is already linked to a message.'))

    @api.model
    def check_generic_restrictions(self, message):
        if message.ttype not in ['text']:
            raise ValidationError(_('%s message not support lists.') % message.ttype)
        if not message.text:
            raise ValidationError(_('Text is required for message with a list.'))
        if len(message.text) > 1024:
            raise ValidationError(_('Text may be up 1024 characters for message with a list.'))

    def check_limits_by_connector(self, message):
        if message.connector_id.connector_type == 'gupshup':
            self.check_generic_restrictions(message)
            for chat_list in self:
                if not (0 < len(chat_list.items_ids) < 10):
                    raise ValidationError(_('Items may be up 10 and at least one.'))
                chat_list.items_ids.check_limits_by_connector(message)


class WhatsappMessageListItem(models.Model):
    _name = 'acrux.chat.message.list.item'
    _description = 'Chat Message List Item'

    list_id = fields.Many2one('acrux.chat.message.list', ondelete='cascade',
                              required=True)
    name = fields.Char('Name', required=True, size=24)
    button_ids = fields.One2many('acrux.chat.message.list.item.button', 'item_id',
                                 string='Options')

    def copy(self, default=None):
        default = default or {}
        item = super(WhatsappMessageListItem, self).copy(default)
        for button_id in self.button_ids:
            button_id.copy(default={'item_id': item.id})
        return item

    def check_limits_by_connector(self, message):
        if message.connector_id.connector_type == 'gupshup':
            for item in self:
                if not (0 < len(item.button_ids) < 10):
                    raise ValidationError(_('Options may be up 10 and at least one.'))


class WhatsappMessageListRelation(models.AbstractModel):
    _name = 'acrux.chat.message.list.relation'
    _description = 'List Relation Class'

    chat_list_id = fields.Many2one('acrux.chat.message.list', string='Whatsapp List', ondelete='set null')

    def unlink(self):
        list_to_del = self.mapped('chat_list_id')
        out = super(WhatsappMessageListRelation, self).unlink()
        list_to_del = list_to_del.filtered(lambda list_chat: list_chat.is_empty())
        list_to_del.unlink()
        return out

    @api.constrains('chat_list_id')
    def _constrains_chat_list(self):
        for record in self:
            if record.chat_list_id:
                record.chat_list_id._constrains_message_ids()

    def _constrains_button_list(self):
        for record in self:
            if record.chat_list_id and record.button_ids:
                raise ValidationError(_('Buttons and Lists are not allowed in same message.'))

    def _constrains_chat_list_id_type(self):
        for record in self:
            if record.chat_list_id:
                record.chat_list_id.check_generic_restrictions(record)
