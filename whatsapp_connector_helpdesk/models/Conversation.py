# -*- coding: utf-8 -*-
from odoo import models, fields, api


class AcruxChatConversation(models.Model):
    _inherit = 'acrux.chat.conversation'

    ticket_id = fields.Many2one('helpdesk.ticket', 'Ticket', ondelete='set null')

    @api.model
    def get_fields_to_read(self):
        out = super(AcruxChatConversation, self).get_fields_to_read()
        out.extend(['ticket_id'])
        return out
