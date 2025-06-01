# -*- coding: utf-8 -*-

from odoo import models, fields, api


class AiInterface(models.TransientModel):
    _inherit = 'acrux.chat.ai.interface.base'
    _name = 'acrux.chat.ai.interface'
    _description = 'AI Interface'

    name = fields.Char('Name', related='conversation_id.name', store=True, readonly=True)
    conversation_id = fields.Many2one('acrux.chat.conversation', string='Conversation',
                                      required=True, ondelete='cascade')
    company_id = fields.Many2one(related='conversation_id.company_id', store=True, readonly=True)
    ai_config_id = fields.Many2one(domain='''[('operation_id.key', '!=', 'audio_transcriptions'),
                                                '|',
                                                ('company_id', '=', company_id),
                                                ('company_id', '=', False)]''')

    @api.onchange('conversation_id', 'ai_config_id')
    def onchange_conv_ai_config(self):
        super(AiInterface, self).onchange_conv_ai_config()
        for interface in self:
            if interface.conversation_id and interface.ai_config_id:
                interface.req_text = interface.ai_config_id.get_initial_text(interface.conversation_id)
                interface.res_text = ''

    def execute_command(self):
        self.ensure_one()
        if self.conversation_id:
            self.res_text = self.ai_config_id.execute_ai(self.req_text, conversation=self.conversation_id)
        else:
            super(AiInterface, self).execute_command()

    def send_message(self):
        self.ensure_one()
        if self.res_text:
            MessageWizard = self.env['acrux.chat.message.wizard']
            wizard = MessageWizard.create({
                'conversation_id': self.conversation_id.id,
                'text': self.res_text,
            })
            wizard.send_message_wizard()
