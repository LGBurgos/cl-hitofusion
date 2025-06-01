
from odoo import models, fields


class HelpdeskTicket(models.Model):

    _inherit = 'helpdesk.ticket'

    conversation_id = fields.Many2one('acrux.chat.conversation', 'ChatRoom',
                                      ondelete='set null', copy=False)
