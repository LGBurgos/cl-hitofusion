# -*- coding: utf-8 -*-

from werkzeug.utils import secure_filename
from odoo import models, _
from odoo.exceptions import ValidationError


WECHAT_AUDIO_FORMAT_ALLOWED = ['audio/x-amr', 'audio/amr', 'audio/x-mp3', 'audio/mp3']
WECHAT_VIDEO_FORMAT_ALLOWED = ['video/mp4']


class Message(models.Model):
    _inherit = 'acrux.chat.message'

    def ca_ttype_audio(self):
        out = super(Message, self).ca_ttype_audio()
        if self.connector_id.is_wechat():
            attach_id, _url = self.get_url_attach(self.res_id)
            filename = attach_id.name
            out['filename'] = secure_filename(filename)
        return out

    def get_url_attach(self, att_id):
        attach_id, url = super(Message, self).get_url_attach(att_id)
        if attach_id and attach_id.mimetype and self.connector_id.is_wechat():
            allowed_formats = []
            if attach_id.mimetype.startswith('audio'):
                allowed_formats = WECHAT_AUDIO_FORMAT_ALLOWED
            elif attach_id.mimetype.startswith('video'):
                allowed_formats = WECHAT_VIDEO_FORMAT_ALLOWED
            if allowed_formats and attach_id.mimetype not in allowed_formats:
                file_type = attach_id.mimetype.split('/')[0]
                raise ValidationError(_('Only %s formats are allowed. Try to install pydub and ffmpeg '
                                        'libraries (In debian distros pip install pydub and apt install ffmpeg).')
                                      % file_type)
        return attach_id, url
