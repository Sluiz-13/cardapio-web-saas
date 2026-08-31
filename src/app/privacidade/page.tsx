export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-bg px-5 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-surface-border shadow-sm p-6 sm:p-8">
        <h1 className="font-display text-2xl uppercase mb-4">
          Aviso de Privacidade
        </h1>

        <div className="space-y-4 text-sm text-ink/80">
          <p>
            <strong>Última atualização: agosto de 2026</strong>
          </p>

          <p>
            O MenuAir respeita a privacidade dos usuários e busca tratar os
            dados pessoais de forma transparente e segura. Este Aviso de
            Privacidade explica quais dados podem ser coletados, como são
            utilizados e quais são os direitos dos titulares.
          </p>

          <p>
            <strong>1. Dados coletados.</strong> Dependendo da utilização do
            MenuAir, podemos tratar dados como nome, telefone, endereço de
            entrega, informações relacionadas ao pedido e dados necessários
            para acesso e utilização do painel administrativo.
          </p>

          <p>
            No caso de pedidos, os dados são fornecidos pelo próprio cliente
            no momento da realização da compra.
          </p>

          <p>
            <strong>2. Como utilizamos os dados.</strong> Os dados pessoais
            podem ser utilizados para:
          </p>

          <ul className="list-disc pl-5 space-y-1">
            <li>Processar e gerenciar pedidos;</li>
            <li>Realizar a entrega dos produtos;</li>
            <li>Entrar em contato com o cliente sobre o pedido;</li>
            <li>
              Processar pagamentos quando houver integração com serviços de
              pagamento;
            </li>
            <li>Permitir o acesso e funcionamento do painel administrativo;</li>
            <li>Prestar suporte ao estabelecimento;</li>
            <li>Manter a segurança e o funcionamento da plataforma;</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <p>
            <strong>3. Base legal.</strong> O tratamento dos dados pessoais é
            realizado de acordo com as hipóteses previstas na Lei Geral de
            Proteção de Dados (LGPD), incluindo a execução de contrato ou de
            procedimentos relacionados à contratação de serviços, o cumprimento
            de obrigações legais e o exercício regular de direitos.
          </p>

          <p>
            Quando necessário, outras bases legais previstas na legislação
            poderão ser utilizadas.
          </p>

          <p>
            <strong>4. Compartilhamento de dados.</strong> Para que determinadas
            funcionalidades do MenuAir funcionem, os dados poderão ser
            compartilhados com prestadores de serviços envolvidos na operação,
            como serviços de pagamento, hospedagem, infraestrutura e entrega.
          </p>

          <p>
            Quando o pedido for realizado para entrega, informações necessárias
            para a realização da entrega poderão ser disponibilizadas ao
            estabelecimento e ao entregador responsável.
          </p>

          <p>
            O MenuAir não vende dados pessoais e não compartilha dados com
            terceiros para fins de marketing sem a devida base legal.
          </p>

          <p>
            <strong>5. Pagamentos.</strong> Quando o pagamento for realizado por
            meio de serviços integrados ao MenuAir, os dados necessários para o
            processamento poderão ser enviados ao respectivo provedor de
            pagamento. O processamento do pagamento estará sujeito também às
            políticas de privacidade e aos termos do serviço utilizado.
          </p>

          <p>
            <strong>6. Armazenamento e segurança.</strong> Adotamos medidas
            técnicas e organizacionais razoáveis para proteger os dados pessoais
            contra acesso não autorizado, perda, alteração ou divulgação
            indevida.
          </p>

          <p>
            Apesar dos cuidados adotados, nenhum sistema conectado à internet
            pode garantir segurança absoluta.
          </p>

          <p>
            <strong>7. Retenção dos dados.</strong> Os dados pessoais são
            mantidos pelo período necessário para cumprir as finalidades
            descritas neste Aviso, atender obrigações legais, resolver eventuais
            conflitos e proteger os direitos do MenuAir e dos usuários.
          </p>

          <p>
            Quando não houver mais necessidade de manutenção dos dados, eles
            poderão ser excluídos, anonimizados ou mantidos apenas quando houver
            fundamento legal para sua conservação.
          </p>

          <p>
            <strong>8. Direitos do titular.</strong> Nos termos da LGPD, o
            titular dos dados pode solicitar, quando aplicável:
          </p>

          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos seus dados;</li>
            <li>
              Correção de dados incompletos, inexatos ou desatualizados;
            </li>
            <li>
              Eliminação de dados tratados com base no consentimento,
              observadas as exceções legais;
            </li>
            <li>Informações sobre o compartilhamento dos dados;</li>
            <li>Outros direitos previstos na legislação aplicável.</li>
          </ul>

          <p>
            Para solicitações relacionadas a um pedido realizado em um
            restaurante, o usuário poderá entrar em contato diretamente com o
            estabelecimento responsável pelo atendimento.
          </p>

          <p>
            <strong>9. Dados de menores.</strong> O MenuAir não é direcionado
            especificamente a crianças. Caso sejam fornecidos dados pessoais de
            menores de idade, o tratamento será realizado de acordo com as
            exigências previstas na legislação aplicável.
          </p>

          <p>
            <strong>10. Alterações deste Aviso.</strong> Este Aviso de
            Privacidade poderá ser atualizado para refletir alterações na
            plataforma, nos serviços utilizados ou na legislação aplicável. A
            versão mais recente estará sempre disponível nesta página.
          </p>

          <p>
            <strong>11. Contato.</strong> Em caso de dúvidas ou solicitações
            relacionadas ao tratamento de dados pessoais pelo MenuAir, entre em
            contato pelos canais de atendimento disponibilizados na plataforma.
          </p>
          {/* FOOTER */}
          <footer className="border-t border-slate-200 py-10 px-6">
            <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-sm text-slate-500 gap-6">
              <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
                <div className="bg-slate-900 text-white p-1 rounded-md w-7 h-7 flex items-center justify-center text-xs">
                  M
                </div>
                Menuair
              </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center text-sm text-slate-500 gap-6">
              <div className="text-center leading-relaxed">
                <p>
                  © {new Date().getFullYear()} Desenvolvido por{" "}
                  <span className="font-medium text-slate-600">
                    Luiz Felippe
                  </span>
                </p>
                <p>Todos os direitos reservados</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}