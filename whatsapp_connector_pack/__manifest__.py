# -*- coding: utf-8 -*-
# =====================================================================================
# License: OPL-1 (Odoo Proprietary License v1.0)
#
# By using or downloading this module, you agree not to make modifications that
# affect sending messages through Acruxlab or avoiding contract a Plan with Acruxlab.
# Support our work and allow us to keep improving this module and the service!
#
# Al utilizar o descargar este módulo, usted se compromete a no realizar modificaciones que
# afecten el envío de mensajes a través de Acruxlab o a evitar contratar un Plan con Acruxlab.
# Apoya nuestro trabajo y permite que sigamos mejorando este módulo y el servicio!
# =====================================================================================
{
    'name': 'ChatRoom PACK. Send from many places and Templates',
    'summary': 'Pack of modules to Send message from many places with Templates '
               '(Sale, Invoice, Purchase, CRM Leads, Product, Stock Picking, Partner). '
               'apichat.io GupShup Chat-Api ChatApi. Whatsapp, Instagram DM, FaceBook Messenger. ChatRoom 2.0.',
    'description': 'Send WhatsApp message from many places with Templates '
                   '(Sale, Invoice, Purchase, CRM Leads, Product, Stock Picking, Partner). '
                   'All in one screen. ChatRoom 2.0.',
    'version': '17.0.2.0',
    'author': 'AcruxLab',
    'live_test_url': 'https://chatroom.acruxlab.com/web/signup',
    'support': 'info@acruxlab.com',
    'price': 0.0,
    'currency': 'USD',
    'images': ['static/description/Banner_PACK_v10.png'],
    'website': 'https://acruxlab.com/plans',
    'license': 'OPL-1',
    'application': False,
    'installable': True,
    'active': False,
    'category': 'Discuss',
    'depends': [
        'whatsapp_connector',
    ],
    'data': [
    ],
    'qweb': [
    ],
    'pre_init_hook': 'pre_init_hook',
}
