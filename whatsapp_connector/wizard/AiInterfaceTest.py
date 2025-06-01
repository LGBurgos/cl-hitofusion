# -*- coding: utf-8 -*-
import argparse
import mimetypes
from odoo import models, fields, _
from odoo.exceptions import ValidationError


class AiInterfaceTest(models.TransientModel):
    _inherit = 'acrux.chat.ai.interface.base'
    _name = 'acrux.chat.ai.interface.test'
    _description = 'AI Interface Test'

    name = fields.Char('Name', related='ai_config_id.name', store=True, readonly=True)
    file_attach = fields.Binary(string='Attachment')
    file_attach_name = fields.Char('File Name')

    def execute_command(self):
        self.ensure_one()
        if self.operation_key in ['audio_transcriptions']:
            if not self.file_attach:
                raise ValidationError(_('Attachment is required.'))
            mimetype, _guessed_ext = mimetypes.guess_type(self.file_attach_name)
            attachment_id = argparse.Namespace(
                name=self.file_attach_name,
                datas=self.file_attach,
                mimetype=mimetype
            )
            self.res_text = self.ai_config_id.execute_ai(attachment_id)
        elif self.operation_key == 'chat_completions':
            raise ValidationError(_('Not implemented.'))
        else:
            super(AiInterfaceTest, self).execute_command()
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'res_model': 'acrux.chat.ai.interface.test',
            'target': 'new',
            'res_id': self.id,
        }
