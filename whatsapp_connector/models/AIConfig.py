# -*- coding: utf-8 -*-

import logging
import requests
import base64
import warnings
from datetime import datetime
from io import BytesIO
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from odoo.tools import safe_eval
try:
    saved_warning_state = warnings.filters[:]
    warnings.simplefilter('ignore')
    import pydub
except Exception:
    pydub = None
finally:
    warnings.filters = saved_warning_state

_logger = logging.getLogger(__name__)


class AIConfigSelector(models.AbstractModel):
    _name = 'acrux.chat.ai.config.selector'
    _description = 'AI Config Selector'

    active = fields.Boolean('Active', default=True)
    key = fields.Char('key', required=True)
    name = fields.Char('Name', required=True, translate=True)

    _sql_constraints = [
        ('key_uniq', 'unique (key)', _('Key must be unique.')),
    ]


class AIConfigOperation(models.Model):
    _inherit = 'acrux.chat.ai.config.selector'
    _name = 'acrux.chat.ai.config.operation'
    _description = 'AI Config Operation'

    help = fields.Char('Help', translate=True)


class AIConfigModel(models.Model):
    _inherit = 'acrux.chat.ai.config.selector'
    _name = 'acrux.chat.ai.config.model'
    _description = 'AI Config Model'

    operation_id = fields.Many2one('acrux.chat.ai.config.operation', ondelete='cascade')


class AIConfig(models.Model):
    _name = 'acrux.chat.ai.config'
    _description = 'AI Config'
    _order = 'sequence, id'

    name = fields.Char('Name', required=True, translate=True)
    endpoint = fields.Char('Endpoint', default='https://api.openai.com/v1', required=True)
    sequence = fields.Integer('Sequence', default=10)
    active = fields.Boolean(default=True)
    company_id = fields.Many2one('res.company', string='Company',
                                 default=lambda self: self.env.company)
    provider = fields.Selection([('openai', 'OpenAI')], string='Provider',
                                required=True, default='openai')
    operation_id = fields.Many2one('acrux.chat.ai.config.operation', string='Operation',
                                   required=True, ondelete='restrict',
                                   default=lambda self: self.env['acrux.chat.ai.config.operation'].search([], limit=1))
    operation_help = fields.Char(related='operation_id.help')
    operation_key = fields.Char(related='operation_id.key')
    add_roles = fields.Boolean('Add roles', default=False)
    ai_model_id = fields.Many2one('acrux.chat.ai.config.model', string='AI Model',
                                  required=True, ondelete='restrict',
                                  domain='[("operation_id", "=", operation_id)]',
                                  help='Model to process a command.')
    message_number = fields.Integer('Messages Number', default=1,
                                    help='Number of message to copy to input.')
    command = fields.Text('AI Command', help='Command sent to the model, must specify '
                          'what to do, for example: translate to Spanish.',
                          translate=True)
    auth_token = fields.Char('Auth Token', required=True, groups='base.group_system')
    temperature = fields.Float('Temperature', default=1.0)
    top_p = fields.Float('Top_p', default=1.0)
    max_tokens = fields.Integer('Max Tokens', default=0)
    presence_penalty = fields.Float('Presence Penalty', default=0.0)
    frequency_penalty = fields.Float('Frequency Penalty', default=0.0)
    only_incoming = fields.Boolean('Copy only incoming')
    advance_command = fields.Text('Extended command')

    @api.constrains('message_number')
    def _constrain_message_number(self):
        for config in self:
            if config.message_number < 0:
                raise ValidationError(_('Messages Number must be greater or equal than 0.'))

    @api.constrains('temperature', 'top_p', 'max_tokens', 'presence_penalty', 'frequency_penalty')
    def _constrain_parameters(self):
        for config in self.filtered(lambda config: config.provider == 'openai'):
            if not (0 <= config.temperature <= 2):
                raise ValidationError(_('Temperature must be between %d and %d.') % (0, 2))
            elif not (0 <= config.top_p <= 1):
                raise ValidationError(_('Top_p must be between 0 and 1.'))
            elif config.max_tokens < 0:
                raise ValidationError(_('Max Tokens must be greater or equal than 0.'))
            elif not (-2 <= config.presence_penalty <= 2):
                raise ValidationError(_('Presence Penalty must be between -2 and 2.'))
            elif not (-2 <= config.frequency_penalty <= 2):
                raise ValidationError(_('Frequency Penalty must be between -2 and 2.'))
            elif config.operation_key == 'audio_transcriptions' and not (0 <= config.temperature <= 1):
                raise ValidationError(_('Temperature must be between %d and %d.') % (0, 1))

    @api.onchange('provider')
    def _onchange_provider(self):
        for config in self.filtered(lambda config: config.provider == 'openai'):
            config.endpoint = 'https://api.openai.com/v1'

    @api.onchange('operation_id')
    def _onchange_operation_id(self):
        ConfigModel = self.env['acrux.chat.ai.config.model']
        for config in self.filtered(lambda config: config.provider == 'openai'):
            if self.operation_id:
                config.ai_model_id = ConfigModel.search([('operation_id', '=', self.operation_id.id)], limit=1)
            else:
                config.ai_model_id = False

    def execute_test_ui(self):
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'res_model': 'acrux.chat.ai.interface.test',
            'target': 'new',
            'context': {'default_ai_config_id': self.id}
        }

    def execute_ai(self, prompt, **kwargs):
        self.ensure_one()
        if not prompt:
            raise ValidationError(_('You must provide a prompt.'))
        out = None
        if self.provider == 'openai':
            out = self.execute_openai(prompt, **kwargs)
        return out

    def execute_openai(self, prompt, **kwargs):
        self.ensure_one()
        out = None
        usage_log = self.create_usage_log(kwargs.get('conversation'))
        if self.operation_key == 'chat_completions':
            message_ids = self.get_messages(prompt)
            if not message_ids:
                raise ValidationError(_('Messages are required.'))
            messages = message_ids.read(['from_me', 'text'])
            messages.reverse()
            messages = list(map(lambda message: {
                'role': 'assistant' if message['from_me'] else 'user',
                'content': message['text']
            }, messages))
            res = self.make_request(messages, usage_log, **kwargs)
            out = res['content']
        elif self.operation_key in ['completions', 'edits']:
            if not prompt:
                raise ValidationError(_('Prompt is required.'))
            out = self.make_request(prompt, usage_log, **kwargs)
            if out and self.add_roles:
                index = out.find(':')
                if index != -1:
                    out = out[(index + 1):]
        elif self.operation_key == 'audio_transcriptions':
            if not prompt:
                raise ValidationError(_('Attachment is required.'))
            out = self.make_request(prompt, usage_log, **kwargs)
        return out

    def get_initial_text(self, conversation):
        self.ensure_one()
        initial_text = ''
        if self.message_number > 0:
            message_ids = self.get_messages(conversation)
            messages = message_ids.read(['from_me', 'text'])
            messages.reverse()
            if self.add_roles:
                def add_rele(message):
                    role = _('Assistant') if message['from_me'] else _('Client')
                    return f'{role}: {message["text"]}'
                messages = list(map(add_rele, messages))
            else:
                messages = list(map(lambda message: message['text'], messages))
            initial_text = '\n'.join(messages)
        return initial_text

    def get_messages(self, conversation, ttype='text'):
        self.ensure_one()
        Message = self.env['acrux.chat.message']
        domain = [('contact_id', '=', conversation.id),
                  ('ttype', '=', ttype)]
        if self.only_incoming:
            domain.append(('from_me', '=', False))
        return Message.search(domain, limit=self.message_number)

    def make_request(self, data_to_process, usage_log, **kwargs):
        self.ensure_one()
        url = self.get_url()
        headers = self.sudo().get_header()
        data = self.get_body(data_to_process, **kwargs)
        _logger.info(f'\n  post => {url}')
        req: requests.Response
        if self.operation_key in ['audio_transcriptions']:
            req = requests.post(url, files=data, headers=headers)
        else:
            req = requests.post(url, json=data, headers=headers)
        _logger.info(f'\n  res => {req.status_code}')
        out = None
        if 200 <= req.status_code < 300:
            out = self.handle_response(req.json(), usage_log)
        else:
            self.handle_request_error(req)
        return out

    def handle_response(self, data: dict, usage_log):
        self.ensure_one()
        out = None
        if self.provider == 'openai':
            if self.operation_key == 'audio_transcriptions':
                data = {'choices': [data]}
            self.update_usage_log(data, usage_log)
            out = data['choices']
            if len(out) != 1:
                if len(out) > 1:
                    raise ValidationError(_('Multiple choices returned'))
                else:
                    raise ValidationError(_('No choices returned'))
            out = out[0]
            if self.operation_key in ['completions', 'edits', 'audio_transcriptions']:
                out = out['text'].strip()
            elif self.operation_key == 'chat_completions':
                out = out['message']
        return out

    def create_usage_log(self, conversation):
        self.ensure_one()
        log_vals = {
            'user_id': self.env.user.id,
            'ai_config_id': self.id,
        }
        if conversation:
            log_vals['conversation_id'] = conversation.id
        return self.env['acrux.chat.ai.usage.log'].sudo().create(log_vals)

    def update_usage_log(self, data, usage_log):
        if data.get('usage'):
            usage = data['usage']
            usage_log.write({
                'sent_tokens': usage['prompt_tokens'],
                'response_tokens': usage['completion_tokens'],
                'total_tokens': usage['total_tokens'],
            })

    def handle_request_error(self, req: requests.Response):
        self.ensure_one()
        error = None
        message = None
        try:
            error = req.json()
        except Exception:
            pass
        if error is not None:
            message = self.handle_json_error(error)
        else:
            message = self.handle_status_code_error(req)
        raise ValidationError(message or _('An error occurred.'))

    def handle_status_code_error(self, req: requests.Response):
        message = None
        if req.text:
            message = req.text
        elif req.status_code == 403:
            message = _('Wrong auth token.')
        return message

    def handle_json_error(self, error: dict) -> str:
        self.ensure_one()
        message = None
        if self.provider == 'openai':
            err = error.get('error', {})
            message = err.get('message') or err.get('code', '').replace('_', ' ').upper()
        return message

    def get_url(self) -> str:
        self.ensure_one()
        out = ''
        if self.provider == 'openai':
            out = f'{self.endpoint.strip("/")}/{self.operation_key.replace("_", "/")}'
        return out

    def get_header(self) -> dict:
        self.ensure_one()
        out = {}
        if self.provider == 'openai':
            out.update({
                'Authorization': f'Bearer {self.auth_token}',
                'Accept': 'application/json',
            })
            if self.operation_key != 'audio_transcriptions':
                out['Content-Type'] = 'application/json'
        return out

    def get_body(self, data_to_process, **kwargs) -> dict:
        '''
            :param data_to_process: str or array para enviar al modelo
        '''
        self.ensure_one()
        out = {}
        if self.provider == 'openai':
            out.update({
                'model': self.ai_model_id.key,
                'temperature': self.temperature,
            })
            if self.max_tokens > 0 and self.operation_key not in ['edits', 'audio_transcriptions']:
                out['max_tokens'] = self.max_tokens
            if self.operation_key not in ['audio_transcriptions']:
                out['top_p'] = self.top_p
            if self.operation_key == 'completions':
                out.update({
                    'presence_penalty': self.presence_penalty,
                    'frequency_penalty': self.frequency_penalty,
                    'prompt': f'{self.get_command(**kwargs)} {data_to_process}'
                })
                if self.add_roles:
                    out['stop'] = list(map(lambda val: ' %s:' % val, [_('Client'), _('Assistant')]))
            elif self.operation_key == 'chat_completions':
                out.update({
                    'presence_penalty': self.presence_penalty,
                    'frequency_penalty': self.frequency_penalty,
                    'messages': data_to_process,
                })
            elif self.operation_key == 'edits':
                out.update({
                    'instruction': self.get_command(**kwargs),
                    'input': data_to_process,
                })
            elif self.operation_key == 'audio_transcriptions':
                if not data_to_process.name:
                    raise ValidationError(_('Filename is required.'))
                file_type = data_to_process.mimetype.split('/')[0]
                if file_type not in ['audio', 'video']:
                    raise ValidationError(_('It can only transcribe audio or video attachment.'))
                allowed_formats = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
                filename = data_to_process.name.strip()
                extension = filename.split('.')[-1]
                file_like = BytesIO(base64.b64decode(data_to_process.datas))
                if extension not in allowed_formats:
                    if pydub:
                        try:
                            audio = pydub.AudioSegment.from_file(file_like)
                            output_io = BytesIO()
                            if file_type == 'audio':
                                audio.export(output_io, format='wav')
                                filename = 'audio.wav'
                            elif file_type == 'video':
                                audio.export(output_io, format='mp4')
                                filename = 'video.mp4'
                            file_like = output_io
                        except Exception as e:
                            _logger.error(e)
                if filename.split('.')[-1] not in allowed_formats:
                    raise ValidationError(_('Only %s formats are allowed. Try to install pydub and ffmpeg '
                                            'libraries (In debian distros pip install pydub and apt install ffmpeg).')
                                          % ', '.join(allowed_formats))
                file_contents = file_like.read()
                out.update({
                    'model': (None, self.ai_model_id.key),
                    'temperature': (None, f'{self.temperature}'),
                    'file': (filename, file_contents)
                })
        return out

    def can_edit_request_text(self):
        self.ensure_one()
        out = True
        if self.provider == 'openai':
            out = self.operation_key not in ['chat_completions', 'audio_transcriptions']
        return out

    def get_info_help(self):
        self.ensure_one()
        out = ''
        if self.provider == 'openai':
            if self.operation_key == 'chat_completions':
                out = _('It will be sent last %s messages.') % self.message_number
            elif self.operation_key == 'audio_transcriptions':
                out = _('Attachment file will be sent.')
        return out

    def get_command(self, **kwargs):
        out = self.command
        if self.advance_command:
            local_dict = {
                'datetime': safe_eval.datetime,
                'pytz': safe_eval.pytz,
                'user': self.env.user,
                'now': fields.Datetime.context_timestamp(self, datetime.today()),
                'self': self,
                'kwargs': kwargs,
                'result': None
            }
            safe_eval.safe_eval(self.advance_command.strip(), locals_dict=local_dict, mode='exec', nocopy=True)
            out = local_dict['result']
        return out
