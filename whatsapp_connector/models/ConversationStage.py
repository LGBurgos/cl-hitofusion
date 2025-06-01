# -*- coding: utf-8 -*-

from odoo import fields, models


class ConversationStage(models.Model):
    _name = 'acrux.chat.conversation.stage'
    _description = 'Chatroom Funnels'
    _rec_name = 'name'
    _order = 'sequence, name, id'

    name = fields.Char('Funnel Name (Stage)', required=True, translate=True)
    sequence = fields.Integer('Sequence', default=10, help='Used to order stages. Lower is better.')
    requirements = fields.Text('Requirements', help='Enter here the internal requirements for ' +
                               'this stage (ex: Offer sent to customer). It will appear as a ' +
                               'tooltip over the stage\'s name.')
    fold = fields.Boolean('Folded in Pipeline', help='This stage is folded in the kanban view ' +
                          'when there are no records in that stage to display.')
