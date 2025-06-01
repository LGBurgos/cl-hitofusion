# -*- coding: utf-8 -*-
from odoo import fields, models


class MailActivityType(models.Model):
    _inherit = "mail.activity.type"

    category = fields.Selection(selection_add=[('chatroom_message', 'Chatroom')])
