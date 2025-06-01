# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class AcruxChatConversationTag(models.Model):
    _name = 'acrux.chat.conversation.tag'
    _description = 'Chat Conversation Tags'
    _order = 'name'

    name = fields.Char('Name', required=True)
    color = fields.Integer('Color', default=0)

    _sql_constraints = [
        ('name', 'unique (name)', _('Name must be unique.'))
    ]

    @api.onchange('name')
    def on_change_name(self):
        for record in self:
            if record.name:
                record.name = record.name.strip().title()
